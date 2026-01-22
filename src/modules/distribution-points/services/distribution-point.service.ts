import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DistributionPoint } from '../entities/distribution-point.entity';
import { PointRequestedProduct } from '../entities/point-requested-product.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { Address } from 'src/modules/auth/entities/adress.enity';
import { RequestedProductStatus, DistributionPointStatus } from '../shared';
import {
  CreateDistributionPointDto,
  ListDistributionPointsDto,
  UpdateDistributionPointDto,
} from '../dto/distribution-point';
import { DistributionPointsMessagesHelper } from '../shared/helpers';
import { ProductsService } from 'src/modules/products/products.service';

@Injectable()
export class DistributionPointService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(DistributionPoint)
    private readonly repository: Repository<DistributionPoint>,

    private readonly productsService: ProductsService,
  ) {}

  private computeRequestedStatus(
    requestedQuantity: number,
    donatedQty: number,
  ): RequestedProductStatus {
    if (requestedQuantity <= 0) return RequestedProductStatus.FULL;
    if (donatedQty >= requestedQuantity) return RequestedProductStatus.FULL;
    return RequestedProductStatus.OPEN;
  }

  async create(body: CreateDistributionPointDto): Promise<DistributionPoint> {
    const title = (body.title ?? '').trim();
    if (!title)
      throw new ConflictException(
        DistributionPointsMessagesHelper.FIELD_IS_REQUIRED('Título'),
      );

    const phone = (body.phone ?? '').trim();
    if (!phone)
      throw new ConflictException(
        DistributionPointsMessagesHelper.FIELD_IS_REQUIRED('Telefone'),
      );

    const ownerId = (body.ownerId ?? '').trim();
    if (!ownerId)
      throw new ConflictException(
        DistributionPointsMessagesHelper.FIELD_IS_REQUIRED(
          'Id do proprietário',
        ),
      );

    const address = body.address;
    if (!address)
      throw new ConflictException(
        DistributionPointsMessagesHelper.FIELD_IS_REQUIRED('Endereço'),
      );

    const requestedProducts = Array.isArray(body.requestedProducts)
      ? body.requestedProducts
      : [];

    if (!requestedProducts.length)
      throw new ConflictException(
        DistributionPointsMessagesHelper.REPORT_ONE_PRODUCT,
      );

    return this.dataSource.transaction(async (transactionManager) => {
      const distributionPointRepository =
        transactionManager.getRepository(DistributionPoint);
      const pointRequestedProductRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );
      const productsRepository = transactionManager.getRepository(Product);
      const addressRepository = transactionManager.getRepository(Address);

      for (const item of requestedProducts) {
        const name = String(item?.name ?? '').trim();
        if (!name) {
          throw new ConflictException(
            DistributionPointsMessagesHelper.INVALID_FIELD_IN_REQUESTED_PRODUCTS(
              'Nome',
            ),
          );
        }

        const quantity = Number(item?.requestedQuantity ?? 0);
        if (!Number.isFinite(quantity) || quantity < 0) {
          throw new ConflictException(
            DistributionPointsMessagesHelper.INVALID_FIELD_IN_REQUESTED_PRODUCTS(
              'Quantidade solicitada',
            ),
          );
        }

        const slug = String(item?.slug ?? '').trim();
        if (slug && slug.length > 200) {
          throw new ConflictException(
            DistributionPointsMessagesHelper.INVALID_FIELD_IN_REQUESTED_PRODUCTS(
              'Slug',
            ),
          );
        }

        const unit = item?.unit === undefined ? undefined : (item.unit ?? null);
        if (
          unit !== undefined &&
          unit !== null &&
          String(unit).trim().length > 30
        ) {
          throw new ConflictException(
            DistributionPointsMessagesHelper.INVALID_FIELD_IN_REQUESTED_PRODUCTS(
              'Unidade',
            ),
          );
        }
      }

      const savedAddress = await addressRepository.save(
        addressRepository.create({
          cep: address.cep,
          estado: address.estado,
          pais: address.pais,
          municipio: address.municipio,
          bairro: address.bairro,
          logradouro: address.logradouro,
          numero: address.numero,
          complemento: address.complemento ?? null,
          latitude: address.latitude ?? null,
          longitude: address.longitude ?? null,
        }),
      );

      const distributionPoint = distributionPointRepository.create({
        title,
        description: body.description ?? null,
        phone,
        ownerId,
        status: body.status ?? DistributionPointStatus.PENDING,
        address: savedAddress,
      });

      const savedDistributionPoint =
        await distributionPointRepository.save(distributionPoint);

      const toInsert: PointRequestedProduct[] = [];

      for (const item of requestedProducts) {
        const name = String(item.name).trim();
        const quantity = Number(item.requestedQuantity ?? 0);
        const unit = item.unit === undefined ? null : (item.unit ?? null);

        const slug =
          String(item.slug ?? '').trim() ||
          this.productsService.normalizeSlug(name);

        let product = await productsRepository.findOne({ where: { slug } });

        if (!product) {
          product = await productsRepository.save(
            productsRepository.create({
              name,
              unit,
              slug,
              active: true,
            }),
          );
        }

        const entity = pointRequestedProductRepository.create({
          point: { id: savedDistributionPoint.id },
          product: { id: product.id },
          requestedQuantity: quantity,
          donatedQuantity: 0,
          status: this.computeRequestedStatus(quantity, 0),
          closesAt: quantity <= 0 ? new Date() : null,
        });

        toInsert.push(entity);
      }

      await pointRequestedProductRepository.save(toInsert);

      const full = await distributionPointRepository.findOne({
        where: { id: savedDistributionPoint.id },
        relations: {
          address: true,
          requestedProducts: { product: true },
          files: true,
        },
      });

      if (!full)
        throw new NotFoundException(
          DistributionPointsMessagesHelper.POINT_NOT_FOUND_AFTER_CREATION,
        );

      return full;
    });
  }

  async list(query: ListDistributionPointsDto) {
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10)));
    const offset = Math.max(0, Number(query.offset ?? 0));
    const skip = offset;

    const page = Math.floor(skip / limit) + 1;

    const queryBuilder = this.repository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.address', 'address')
      .leftJoinAndSelect('p.requestedProducts', 'rp')
      .leftJoinAndSelect('rp.product', 'product')
      .take(limit)
      .skip(skip);

    if (query.ownerId)
      queryBuilder.andWhere('p.ownerId = :ownerId', {
        ownerId: query.ownerId,
      });

    if (query.q && String(query.q).trim()) {
      const q = String(query.q).trim();
      queryBuilder.andWhere(
        '(p.title ILIKE :q OR p.description ILIKE :q OR p.phone ILIKE :q OR address.municipio ILIKE :q OR address.bairro ILIKE :q OR address.logradouro ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    const sortByRaw = String(query.sortBy ?? 'createdAt');
    const sortRaw = String(query.sort ?? 'DESC').toUpperCase();
    const sortDir = sortRaw === 'ASC' ? 'ASC' : 'DESC';

    const allowedSortBy = new Set([
      'createdAt',
      'updatedAt',
      'title',
      'status',
      'municipio',
      'estado',
    ]);
    const sortBy = allowedSortBy.has(sortByRaw) ? sortByRaw : 'createdAt';

    if (sortBy === 'municipio')
      queryBuilder.orderBy('address.municipio', sortDir);
    else if (sortBy === 'estado')
      queryBuilder.orderBy('address.estado', sortDir);
    else queryBuilder.orderBy(`p.${sortBy}`, sortDir);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<DistributionPoint> {
    const point = await this.repository.findOne({
      where: { id },
      relations: {
        address: true,
        requestedProducts: { product: true },
        files: true,
      },
    });
    if (!point)
      throw new NotFoundException(
        DistributionPointsMessagesHelper.POINT_NOT_FOUND,
      );
    return point;
  }

  async update(
    id: string,
    body: UpdateDistributionPointDto,
  ): Promise<DistributionPoint> {
    const point = await this.repository.findOne({
      where: { id },
      relations: { address: true },
    });
    if (!point)
      throw new NotFoundException(
        DistributionPointsMessagesHelper.POINT_NOT_FOUND,
      );

    if (body.title !== undefined) {
      const title = String(body.title ?? '').trim();
      if (!title)
        throw new ConflictException(
          DistributionPointsMessagesHelper.FIELD_INVALID('Título'),
        );
      point.title = title;
    }

    if (body.description !== undefined)
      point.description = body.description ?? null;

    if (body.phone !== undefined) {
      const phone = String(body.phone ?? '').trim();
      if (!phone)
        throw new ConflictException(
          DistributionPointsMessagesHelper.FIELD_INVALID('Telefone'),
        );
      point.phone = phone;
    }

    if (body.status !== undefined) {
      point.status = body.status as DistributionPointStatus;
    }

    if (body.address !== undefined && body.address) {
      const a = body.address;

      if (!point.address) {
        point.address = new Address();
      }

      if (a.cep !== undefined) point.address.cep = a.cep;
      if (a.estado !== undefined) point.address.estado = a.estado;
      if (a.pais !== undefined) point.address.pais = a.pais;
      if (a.municipio !== undefined) point.address.municipio = a.municipio;
      if (a.bairro !== undefined) point.address.bairro = a.bairro;
      if (a.logradouro !== undefined) point.address.logradouro = a.logradouro;
      if (a.numero !== undefined) point.address.numero = a.numero;
      if (a.complemento !== undefined)
        point.address.complemento = a.complemento ?? null;
      if (a.latitude !== undefined) point.address.latitude = a.latitude ?? null;
      if (a.longitude !== undefined)
        point.address.longitude = a.longitude ?? null;
    }

    return this.dataSource.transaction(async (transactionManager) => {
      const distributionPointRepository =
        transactionManager.getRepository(DistributionPoint);
      const addressRepository = transactionManager.getRepository(Address);

      if (point.address) {
        await addressRepository.save(point.address);
      }

      await distributionPointRepository.save(point);

      const full = await distributionPointRepository.findOne({
        where: { id: point.id },
        relations: {
          address: true,
          requestedProducts: { product: true },
          files: true,
        },
      });

      if (!full)
        throw new NotFoundException(
          DistributionPointsMessagesHelper.POINT_NOT_FOUND,
        );
      return full;
    });
  }

  async remove(id: string): Promise<{ ok: true }> {
    const point = await this.repository.findOne({ where: { id } });
    if (!point)
      throw new NotFoundException(
        DistributionPointsMessagesHelper.POINT_NOT_FOUND,
      );

    await this.repository.delete({ id });

    return { ok: true };
  }
}
