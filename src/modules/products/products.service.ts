import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ILike, IsNull, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ListProductsDto, CreateProductDto, UpdateProductDto } from './dto';
import { ProductMessagesHelper } from './shared';

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.backfillMissingSlugs();
  }

  normalizeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+)|(-+$)/g, '');
  }

  private async backfillMissingSlugs(): Promise<void> {
    const missingSlugs = await this.repository.find({
      where: [{ slug: IsNull() }, { slug: '' }],
      select: ['id', 'name', 'slug'],
    });

    if (missingSlugs.length === 0) {
      return;
    }

    for (const product of missingSlugs) {
      const base = this.normalizeSlug(product.name || 'product') || 'product';
      let slug = base;
      let suffix = 1;

      while (true) {
        const existing = await this.repository.findOne({ where: { slug } });
        if (!existing || existing.id === product.id) break;
        slug = `${base}-${suffix}`;
        suffix += 1;
      }

      await this.repository.update(product.id, { slug });
    }

    this.logger.log(`Backfilled slug for ${missingSlugs.length} products.`);
  }

  async create(body: CreateProductDto): Promise<Product> {
    const slug = this.normalizeSlug(body.slug || body.name);

    const existing = await this.repository.findOne({ where: { slug } });
    if (existing)
      throw new ConflictException(
        ProductMessagesHelper.PRODUCT_SLUG_ALREADY_EXISTS,
      );

    const entity = this.repository.create({
      slug,
      name: body.name,
      unit: body.unit ?? null,
      active: body.active ?? true,
    });

    return this.repository.save(entity);
  }

  async getOrCreateByName(
    name: string,
    unit?: string | null,
  ): Promise<Product> {
    const slug = this.normalizeSlug(name);

    const existing = await this.repository.findOne({ where: { slug } });
    if (existing) return existing;

    const entity = this.repository.create({
      slug,
      name: name,
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

  async list(query: ListProductsDto, manager?: EntityManager) {
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10)));
    const offset = Math.max(0, Number(query.offset ?? 0));
    const skip = offset;

    const page = Math.floor(skip / limit) + 1;

    const where: any = {
      active: query.active,
    };

    if (query.q) {
      const search = query.q;
      where.name = ILike(`%${search}%`);
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

  async findById(id: string, manager?: EntityManager): Promise<Product> {
    const product = await this.repository.findOne({ where: { id } });
    if (!product)
      throw new NotFoundException(ProductMessagesHelper.PRODUCT_NOT_FOUND);
    return product;
  }

  async findBySlug(slug: string, manager?: EntityManager): Promise<Product> {
    const fixed = this.normalizeSlug(slug ?? '');
    const product = await this.repository.findOne({ where: { slug: fixed } });
    if (!product)
      throw new NotFoundException(ProductMessagesHelper.PRODUCT_NOT_FOUND);
    return product;
  }

  async update(id: string, body: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);

    if (body.name !== undefined) {
      product.name = body.name;
      if (body.slug === undefined) {
        product.slug = this.normalizeSlug(body.name);
      }
    }

    if (body.slug !== undefined) {
      product.slug = this.normalizeSlug(body.slug);
    }

    if (body.unit !== undefined) {
      product.unit = body.unit ?? null;
    }

    if (body.active !== undefined) {
      product.active = body.active;
    }

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

  async remove(id: string, manager?: EntityManager): Promise<{ ok: true }> {
    const product = await this.findById(id, manager);

    await this.repository.remove(product);
    return { ok: true };
  }
}
