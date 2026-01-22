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

@Injectable()
export class DistributionPointService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(DistributionPoint)
    private readonly repository: Repository<DistributionPoint>,
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
    if (!title) throw new ConflictException('Título é obrigatório.');

    const phone = (body.phone ?? '').trim();
    if (!phone) throw new ConflictException('Telefone é obrigatório.');

    const ownerId = (body.ownerId ?? '').trim();
    if (!ownerId) throw new ConflictException('ownerId é obrigatório.');

    const address = body.address;
    if (!address) throw new ConflictException('Endereço é obrigatório.');

    const requestedItems = Array.isArray(body.requestedProducts)
      ? body.requestedProducts
      : [];

    if (!requestedItems.length)
      throw new ConflictException('Informe ao menos 1 produto solicitado.');

    return this.dataSource.transaction(async (transactionManager) => {
      const distributionPointRepository =
        transactionManager.getRepository(DistributionPoint);
      const requestedPointRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );
      const productsRepository = transactionManager.getRepository(Product);
      const addressRepository = transactionManager.getRepository(Address);

      for (const item of requestedItems) {
        const productId = (item?.productId ?? '').trim();
        if (!productId)
          throw new ConflictException(
            'productId inválido em requestedProducts.',
          );

        const qty = Number(item?.requestedQuantity ?? 0);
        if (!Number.isFinite(qty) || qty < 0)
          throw new ConflictException(
            'requestedQuantity inválido em requestedProducts.',
          );

        const product = await productsRepository.findOne({
          where: { id: productId },
        });
        if (!product) throw new NotFoundException('Produto não encontrado.');
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

      const point = distributionPointRepository.create({
        title,
        description: body.description ?? null,
        phone,
        ownerId,
        status: body.status ?? DistributionPointStatus.PENDING,
        address: savedAddress,
      });

      const savedPoint = await distributionPointRepository.save(point);

      const toInsert: PointRequestedProduct[] = [];

      for (const item of requestedItems) {
        const qty = Number(item.requestedQuantity ?? 0);

        const entity = requestedPointRepository.create({
          point: { id: savedPoint.id },
          product: { id: item.productId },
          requestedQuantity: qty,
          donatedQuantity: 0,
          status: this.computeRequestedStatus(qty, 0),
          closesAt: qty <= 0 ? new Date() : null,
        });

        toInsert.push(entity);
      }

      await requestedPointRepository.save(toInsert);

      const full = await distributionPointRepository.findOne({
        where: { id: savedPoint.id },
        relations: {
          address: true,
          requestedProducts: { product: true },
          files: true,
        },
      });

      if (!full)
        throw new NotFoundException('Ponto não encontrado após criação.');

      return full;
    });
  }

  async list(query: ListDistributionPointsDto) {
    const limit = Math.min(
      100,
      Math.max(1, Number((query as any).limit ?? 10)),
    );
    const offset = Math.max(0, Number((query as any).offset ?? 0));
    const skip = offset;

    const page = Math.floor(skip / limit) + 1;

    const qb = this.repository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.address', 'address')
      .leftJoinAndSelect('p.requestedProducts', 'rp')
      .leftJoinAndSelect('rp.product', 'product')
      .take(limit)
      .skip(skip);

    if ((query as any).ownerId)
      qb.andWhere('p.ownerId = :ownerId', { ownerId: (query as any).ownerId });

    if ((query as any).status)
      qb.andWhere('p.status = :status', { status: (query as any).status });

    if ((query as any).addressMunicipio) {
      qb.andWhere('address.municipio ILIKE :municipio', {
        municipio: `%${String((query as any).addressMunicipio).trim()}%`,
      });
    }

    if ((query as any).addressEstado) {
      qb.andWhere('address.estado ILIKE :estado', {
        estado: `%${String((query as any).addressEstado).trim()}%`,
      });
    }

    if ((query as any).q && String((query as any).q).trim()) {
      const q = String((query as any).q).trim();
      qb.andWhere(
        '(p.title ILIKE :q OR p.description ILIKE :q OR p.phone ILIKE :q OR address.municipio ILIKE :q OR address.bairro ILIKE :q OR address.logradouro ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    const sortByRaw = String((query as any).sortBy ?? 'createdAt');
    const sortRaw = String((query as any).sort ?? 'DESC').toUpperCase();
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

    if (sortBy === 'municipio') qb.orderBy('address.municipio', sortDir);
    else if (sortBy === 'estado') qb.orderBy('address.estado', sortDir);
    else qb.orderBy(`p.${sortBy}`, sortDir);

    const [items, total] = await qb.getManyAndCount();

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
      throw new NotFoundException('Ponto de distribuição não encontrado.');
    return point;
  }

  async update(
    id: string,
    dto: UpdateDistributionPointDto,
  ): Promise<DistributionPoint> {
    const point = await this.repository.findOne({
      where: { id },
      relations: { address: true },
    });
    if (!point)
      throw new NotFoundException('Ponto de distribuição não encontrado.');

    if (dto.title !== undefined) {
      const title = String(dto.title ?? '').trim();
      if (!title) throw new ConflictException('Título inválido.');
      point.title = title;
    }

    if (dto.description !== undefined)
      point.description = dto.description ?? null;

    if ((dto as any).phone !== undefined) {
      const phone = String((dto as any).phone ?? '').trim();
      if (!phone) throw new ConflictException('Telefone inválido.');
      point.phone = phone;
    }

    if ((dto as any).status !== undefined) {
      point.status = (dto as any).status as DistributionPointStatus;
    }

    if ((dto as any).address !== undefined && (dto as any).address) {
      const a = (dto as any).address;

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
        throw new NotFoundException('Ponto de distribuição não encontrado.');
      return full;
    });
  }

  async remove(id: string): Promise<{ ok: true }> {
    const point = await this.repository.findOne({ where: { id } });
    if (!point)
      throw new NotFoundException('Ponto de distribuição não encontrado.');

    await this.repository.delete({ id });

    return { ok: true };
  }
}
