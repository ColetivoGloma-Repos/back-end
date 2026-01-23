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
import { PointRequestedProductsService } from './point-requested-product.service';

@Injectable()
export class DistributionPointService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(DistributionPoint)
    private readonly repository: Repository<DistributionPoint>,

    private readonly productsService: ProductsService,

    private readonly requestedProductService: PointRequestedProductsService,
  ) {}

  async create(body: CreateDistributionPointDto): Promise<DistributionPoint> {
    const requestedProducts = Array.isArray(body.requestedProducts)
      ? body.requestedProducts
      : [];

    if (!requestedProducts.length) {
      throw new ConflictException(
        DistributionPointsMessagesHelper.REPORT_ONE_PRODUCT,
      );
    }

    return this.dataSource.transaction(async (transactionManager) => {
      const distributionPointRepository =
        transactionManager.getRepository(DistributionPoint);
      const pointRequestedProductRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );
      const productsRepository = transactionManager.getRepository(Product);
      const addressRepository = transactionManager.getRepository(Address);

      const address = body.address;

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
        title: body.title,
        description: body.description ?? null,
        phone: body.phone,
        ownerId: body.ownerId,
        status: body.status ?? DistributionPointStatus.PENDING,
        address: savedAddress,
      });

      const savedDistributionPoint =
        await distributionPointRepository.save(distributionPoint);

      const toSave: PointRequestedProduct[] = [];

      for (const item of requestedProducts) {
        const slug = this.productsService.normalizeSlug(item.slug || item.name);

        let product = await productsRepository.findOne({ where: { slug } });

        if (!product) {
          product = await productsRepository.save(
            productsRepository.create({
              name: item.name,
              unit: item.unit,
              slug,
              active: true,
            }),
          );
        }

        const computeStatus = this.requestedProductService.computeStatus;
        const computedStatus = computeStatus(item.requestedQuantity, 0);

        const entity = pointRequestedProductRepository.create({
          point: { id: savedDistributionPoint.id },
          product: { id: product.id },
          requestedQuantity: item.requestedQuantity,
          donatedQuantity: 0,
          status: computedStatus,
          closesAt:
            computedStatus === RequestedProductStatus.FULL ? new Date() : null,
        });

        toSave.push(entity);
      }

      await pointRequestedProductRepository.save(toSave);

      const full = await distributionPointRepository.findOne({
        where: { id: savedDistributionPoint.id },
        relations: {
          address: true,
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
      .createQueryBuilder('distributionPoint')
      .leftJoinAndSelect('distributionPoint.address', 'address')
      .leftJoin('distributionPoint.requestedProducts', 'rp')
      .leftJoin('rp.product', 'product')
      .take(limit)
      .skip(skip);

    if (query.ownerId)
      queryBuilder.andWhere('distributionPoint.ownerId = :ownerId', {
        ownerId: query.ownerId,
      });

    if (query.q && String(query.q).trim()) {
      const q = String(query.q).trim();
      queryBuilder.andWhere(
        '(distributionPoint.title ILIKE :q OR distributionPoint.description ILIKE :q OR distributionPoint.phone ILIKE :q OR address.municipio ILIKE :q OR address.bairro ILIKE :q OR address.logradouro ILIKE :q)',
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

    if (sortBy === 'municipio') {
      queryBuilder.orderBy('address.municipio', sortDir);
    } else if (sortBy === 'estado') {
      queryBuilder.orderBy('address.estado', sortDir);
    } else {
      queryBuilder.orderBy(`distributionPoint.${sortBy}`, sortDir);
    }

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
        files: true,
      },
    });

    if (!point) {
      throw new NotFoundException(
        DistributionPointsMessagesHelper.POINT_NOT_FOUND,
      );
    }

    return point;
  }

  async update(
    id: string,
    body: UpdateDistributionPointDto,
  ): Promise<DistributionPoint> {
    const distributionPoint = await this.repository.findOne({
      where: { id },
      relations: { address: true },
    });
    if (!distributionPoint)
      throw new NotFoundException(
        DistributionPointsMessagesHelper.POINT_NOT_FOUND,
      );

    if (body.title !== undefined) {
      distributionPoint.title = body.title;
    }

    if (body.description !== undefined)
      distributionPoint.description = body.description ?? null;

    if (body.phone !== undefined) {
      distributionPoint.phone = body.phone;
    }

    if (body.status !== undefined) {
      distributionPoint.status = body.status;
    }

    if (body.address !== undefined && body.address) {
      const address = body.address;

      if (!distributionPoint.address) {
        distributionPoint.address = new Address();
      }

      if (address.cep !== undefined)
        distributionPoint.address.cep = address.cep;
      if (address.estado !== undefined)
        distributionPoint.address.estado = address.estado;
      if (address.pais !== undefined)
        distributionPoint.address.pais = address.pais;
      if (address.municipio !== undefined)
        distributionPoint.address.municipio = address.municipio;
      if (address.bairro !== undefined)
        distributionPoint.address.bairro = address.bairro;
      if (address.logradouro !== undefined)
        distributionPoint.address.logradouro = address.logradouro;
      if (address.numero !== undefined)
        distributionPoint.address.numero = address.numero;
      if (address.complemento !== undefined)
        distributionPoint.address.complemento = address.complemento ?? null;
      if (address.latitude !== undefined)
        distributionPoint.address.latitude = address.latitude ?? null;
      if (address.longitude !== undefined)
        distributionPoint.address.longitude = address.longitude ?? null;
    }

    return this.dataSource.transaction(async (transactionManager) => {
      const distributionPointRepository =
        transactionManager.getRepository(DistributionPoint);
      const addressRepository = transactionManager.getRepository(Address);

      if (distributionPoint.address) {
        await addressRepository.save(distributionPoint.address);
      }

      await distributionPointRepository.save(distributionPoint);

      const full = await distributionPointRepository.findOne({
        where: { id: distributionPoint.id },
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
    const distributionPoint = await this.repository.findOne({ where: { id } });
    if (!distributionPoint)
      throw new NotFoundException(
        DistributionPointsMessagesHelper.POINT_NOT_FOUND,
      );

    await this.repository.delete({ id });

    return { ok: true };
  }
}
