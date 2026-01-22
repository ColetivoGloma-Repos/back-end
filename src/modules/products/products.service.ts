import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ListProductsDto, CreateProductDto, UpdateProductDto } from './dto';
import { ProductMessagesHelper } from './shared';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  private normalizeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+)|(-+$)/g, '');
  }

  async create(body: CreateProductDto): Promise<Product> {
    const name = (body.name ?? '').trim();
    if (!name)
      throw new ConflictException(ProductMessagesHelper.PRODUCT_NAME_REQUIRED);

    const slug = this.normalizeSlug(body.slug?.trim() || name);

    const existing = await this.repository.findOne({ where: { slug } });
    if (existing)
      throw new ConflictException(
        ProductMessagesHelper.PRODUCT_SLUG_ALREADY_EXISTS,
      );

    const entity = this.repository.create({
      name,
      slug,
      unit: body.unit ?? null,
      active: body.active ?? true,
    });

    return this.repository.save(entity);
  }

  async getOrCreateByName(
    name: string,
    unit?: string | null,
  ): Promise<Product> {
    const fixedName = (name ?? '').trim();
    if (!fixedName)
      throw new ConflictException(ProductMessagesHelper.PRODUCT_NAME_REQUIRED);

    const slug = this.normalizeSlug(fixedName);

    const existing = await this.repository.findOne({ where: { slug } });
    if (existing) return existing;

    const entity = this.repository.create({
      name: fixedName,
      slug,
      unit: unit ?? null,
      active: true,
    });

    try {
      return await this.repository.save(entity);
    } catch {
      const retry = await this.repository.findOne({ where: { slug } });
      if (retry) return retry;
      throw new ConflictException(ProductMessagesHelper.FAIL_TO_CREATE_PRODUCT);
    }
  }

  async list(query: ListProductsDto) {
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10)));
    const offset = Math.max(0, Number(query.offset ?? 0));
    const skip = offset;

    const page = Math.floor(skip / limit) + 1;

    const where: any = {};
    if (typeof query.active === 'boolean') where.active = query.active;

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      where.name = ILike(`%${q}%`);
    }

    const [items, total] = await this.repository.findAndCount({
      where,
      order: { name: 'ASC' },
      take: limit,
      skip,
    });

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Product> {
    const product = await this.repository.findOne({ where: { id } });
    if (!product)
      throw new NotFoundException(ProductMessagesHelper.PRODUCT_NOT_FOUND);
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const fixed = this.normalizeSlug(slug ?? '');
    const product = await this.repository.findOne({ where: { slug: fixed } });
    if (!product)
      throw new NotFoundException(ProductMessagesHelper.PRODUCT_NOT_FOUND);
    return product;
  }

  async update(id: string, body: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);

    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name)
        throw new ConflictException(
          ProductMessagesHelper.PRODUCT_NAME_NOT_EMPTY,
        );
      product.name = name;

      if (!body.slug) {
        product.slug = this.normalizeSlug(name);
      }
    }

    if (typeof body.slug === 'string') {
      const slug = this.normalizeSlug(body.slug);
      if (!slug)
        throw new ConflictException(ProductMessagesHelper.INVALID_SLUG);
      product.slug = slug;
    }

    if (body.unit !== undefined) product.unit = body.unit ?? null;
    if (typeof body.active === 'boolean') product.active = body.active;

    if (product.slug) {
      const other = await this.repository.findOne({
        where: { slug: product.slug },
      });
      if (other && other.id !== product.id) {
        throw new ConflictException(
          ProductMessagesHelper.PRODUCT_SLUG_ALREADY_EXISTS,
        );
      }
    }

    return this.repository.save(product);
  }

  async setActive(id: string, active: boolean): Promise<Product> {
    const product = await this.findById(id);
    product.active = !!active;
    return this.repository.save(product);
  }

  async remove(id: string): Promise<{ ok: true }> {
    const product = await this.findById(id);
    await this.repository.remove(product);
    return { ok: true };
  }
}
