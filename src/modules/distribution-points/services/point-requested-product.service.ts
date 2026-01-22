import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointRequestedProduct } from '../entities/point-requested-product.entity';
import { DistributionPoint } from '../entities/distribution-point.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { RequestedProductStatus } from '../shared';
import {
  CreatePointRequestedProductDto,
  ListPointRequestedProductsDto,
  UpdatePointRequestedProductDto,
} from '../dto/point-requested-product';
import { ProductMessagesHelper } from 'src/modules/products/shared';
import {
  DistributionPointsMessagesHelper,
  PointRequestedProductsMessagesHelper,
} from '../shared/helpers';

@Injectable()
export class PointRequestedProductsService {
  constructor(
    @InjectRepository(PointRequestedProduct)
    private readonly repository: Repository<PointRequestedProduct>,

    @InjectRepository(DistributionPoint)
    private readonly pointsRepository: Repository<DistributionPoint>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  private computeStatus(
    requestedQuantity: number,
    donatedQuantity: number,
  ): RequestedProductStatus {
    if (requestedQuantity <= 0) return RequestedProductStatus.FULL;
    if (donatedQuantity >= requestedQuantity)
      return RequestedProductStatus.FULL;
    return RequestedProductStatus.OPEN;
  }

  async create(
    body: CreatePointRequestedProductDto,
  ): Promise<PointRequestedProduct> {
    const distributionPoint = await this.pointsRepository.findOne({
      where: { id: body.pointId },
    });
    if (!distributionPoint)
      throw new NotFoundException(
        DistributionPointsMessagesHelper.POINT_NOT_FOUND,
      );

    const product = await this.productsRepository.findOne({
      where: { id: body.productId },
    });
    if (!product)
      throw new NotFoundException(ProductMessagesHelper.PRODUCT_NOT_FOUND);

    const requestedQuantity = Number(body.requestedQuantity ?? 0);
    if (!Number.isFinite(requestedQuantity) || requestedQuantity < 0) {
      throw new ConflictException(
        PointRequestedProductsMessagesHelper.INVALID_QUANTITY_SOLICITED,
      );
    }

    const existing = await this.repository.findOne({
      where: { pointId: body.pointId, productId: body.productId },
    });

    if (existing) {
      if (existing.status !== RequestedProductStatus.REMOVED) {
        throw new ConflictException(
          DistributionPointsMessagesHelper.PRODUCT_ALREADY_REQUESTED,
        );
      }

      const nextRequested = requestedQuantity;
      const nextDonated = Math.max(0, Number(existing.donatedQuantity ?? 0));
      existing.requestedQuantity = nextRequested;
      existing.donatedQuantity = nextDonated;
      existing.status = this.computeStatus(nextRequested, nextDonated);
      existing.closesAt =
        existing.status === RequestedProductStatus.FULL ? new Date() : null;

      return this.repository.save(existing);
    }

    const entity = this.repository.create({
      pointId: body.pointId,
      productId: body.productId,
      requestedQuantity,
      donatedQuantity: 0,
      status: this.computeStatus(requestedQuantity, 0),
      closesAt: requestedQuantity <= 0 ? new Date() : null,
    });

    return this.repository.save(entity);
  }

  async list(query: ListPointRequestedProductsDto) {
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10)));
    const offset = Math.max(0, Number(query.offset ?? 0));
    const skip = offset;

    const page = Math.floor(skip / limit) + 1;

    const queryBuilder = this.repository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.product', 'product')
      .leftJoinAndSelect('r.point', 'point')
      .take(limit)
      .skip(skip);

    const sortByRaw = (query.sortBy ?? 'createdAt').toString();
    const sortRaw = (query.sort ?? 'DESC').toString().toUpperCase();

    const sortDir = sortRaw === 'ASC' ? 'ASC' : 'DESC';
    const allowedSortBy = new Set([
      'createdAt',
      'updatedAt',
      'requestedQuantity',
      'donatedQuantity',
      'status',
      'productName',
      'pointTitle',
    ]);

    const sortBy = allowedSortBy.has(sortByRaw) ? sortByRaw : 'createdAt';

    if (sortBy === 'productName') queryBuilder.orderBy('product.name', sortDir);
    else if (sortBy === 'pointTitle')
      queryBuilder.orderBy('point.title', sortDir);
    else queryBuilder.orderBy(`r.${sortBy}`, sortDir);

    if (query.pointId)
      queryBuilder.andWhere('r.pointId = :pointId', { pointId: query.pointId });
    if (query.productId)
      queryBuilder.andWhere('r.productId = :productId', {
        productId: query.productId,
      });

    if (query.status)
      queryBuilder.andWhere('r.status = :status', { status: query.status });

    if (query.activeOnly === true) {
      queryBuilder.andWhere('r.status IN (:...st)', {
        st: [RequestedProductStatus.OPEN, RequestedProductStatus.FULL],
      });
    }

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      queryBuilder.andWhere('product.name ILIKE :q OR product.slug ILIKE :q', {
        q: `%${q}%`,
      });
    }

    const [requestedPoints, total] = await queryBuilder.getManyAndCount();

    return {
      items: requestedPoints,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<PointRequestedProduct> {
    const requestedPoint = await this.repository.findOne({
      where: { id },
      relations: { product: true, point: true },
    });
    if (!requestedPoint)
      throw new NotFoundException(
        PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
      );
    return requestedPoint;
  }

  async update(
    id: string,
    body: UpdatePointRequestedProductDto,
  ): Promise<PointRequestedProduct> {
    const requestedPoint = await this.repository.findOne({ where: { id } });
    if (!requestedPoint)
      throw new NotFoundException(
        PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
      );

    if (body.requestedQuantity !== undefined) {
      const requestedQuantity = Number(body.requestedQuantity);
      if (!Number.isFinite(requestedQuantity) || requestedQuantity < 0) {
        throw new ConflictException(
          PointRequestedProductsMessagesHelper.INVALID_QUANTITY_SOLICITED,
        );
      }
      requestedPoint.requestedQuantity = requestedQuantity;
    }

    if (body.productId) {
      const product = await this.productsRepository.findOne({
        where: { id: body.productId },
      });
      if (!product)
        throw new NotFoundException(ProductMessagesHelper.PRODUCT_NOT_FOUND);
      requestedPoint.productId = body.productId;
    }

    if (body.status) {
      requestedPoint.status = body.status;
    }

    if (body.closesAt !== undefined) {
      requestedPoint.closesAt = body.closesAt ? new Date(body.closesAt) : null;
    }

    const nextStatus =
      requestedPoint.status === RequestedProductStatus.REMOVED
        ? RequestedProductStatus.REMOVED
        : this.computeStatus(
            Number(requestedPoint.requestedQuantity ?? 0),
            Number(requestedPoint.donatedQuantity ?? 0),
          );

    requestedPoint.status = nextStatus;
    requestedPoint.closesAt =
      nextStatus === RequestedProductStatus.FULL
        ? (requestedPoint.closesAt ?? new Date())
        : null;

    return this.repository.save(requestedPoint);
  }

  async remove(id: string): Promise<{ ok: true }> {
    const requestedPoint = await this.repository.findOne({ where: { id } });
    if (!requestedPoint)
      throw new NotFoundException(
        PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
      );

    requestedPoint.status = RequestedProductStatus.REMOVED;
    requestedPoint.closesAt = new Date();

    await this.repository.save(requestedPoint);

    return { ok: true };
  }
}
