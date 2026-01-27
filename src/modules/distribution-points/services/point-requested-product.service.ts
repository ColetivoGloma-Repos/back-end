import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PointRequestedProduct } from '../entities/point-requested-product.entity';
import { DistributionPoint } from '../entities/distribution-point.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { DonationStatus, RequestedProductStatus } from '../shared';
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
import { ProductsService } from 'src/modules/products/products.service';
import { Donation } from '../entities';
import { buildPagination } from 'src/common/helpers';

@Injectable()
export class PointRequestedProductsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(PointRequestedProduct)
    private readonly repository: Repository<PointRequestedProduct>,

    @InjectRepository(DistributionPoint)
    private readonly pointsRepository: Repository<DistributionPoint>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    private readonly productsService: ProductsService,
  ) {}

  computeStatus(
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
  ): Promise<PointRequestedProduct[]> {
    const distributionPoint = await this.pointsRepository.findOne({
      where: { id: body.distributionPointId },
    });

    if (!distributionPoint) {
      throw new NotFoundException(
        DistributionPointsMessagesHelper.POINT_NOT_FOUND,
      );
    }

    const requestedProducts = Array.isArray(body.requestedProducts)
      ? body.requestedProducts
      : [];

    if (!requestedProducts.length) {
      throw new ConflictException(
        DistributionPointsMessagesHelper.REPORT_ONE_PRODUCT,
      );
    }

    return this.dataSource.transaction(async (transactionManager) => {
      const requestedProductRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );
      const productsRepository = transactionManager.getRepository(Product);

      const normalized = requestedProducts.map((item) => {
        const slug = this.productsService.normalizeSlug(item.slug || item.name);

        return {
          slug,
          name: item.name,
          unit: item.unit,
          requestedQuantity: Number(item.requestedQuantity ?? 0),
        };
      });

      const slugs = Array.from(new Set(normalized.map((x) => x.slug)));

      const existingProducts = await productsRepository.find({
        where: { slug: In(slugs) },
      });

      const productBySlug = new Map<string, Product>();
      for (const product of existingProducts) {
        productBySlug.set(product.slug, product);
      }

      const productsToCreate: Product[] = [];
      for (const product of normalized) {
        if (!productBySlug.has(product.slug)) {
          productsToCreate.push(
            productsRepository.create({
              slug: product.slug,
              name: product.name,
              unit: product.unit,
              active: true,
            }),
          );
        }
      }

      if (productsToCreate.length) {
        const created = await productsRepository.save(productsToCreate);
        for (const product of created) {
          productBySlug.set(product.slug, product);
        }
      }

      const payloadByProductId = new Map<string, number>();

      for (const item of normalized) {
        const product = productBySlug.get(item.slug);
        if (!product) continue;

        const productId = product.id;

        const current = payloadByProductId.get(productId);
        if (current !== undefined) {
          payloadByProductId.set(productId, current + item.requestedQuantity);
        } else {
          payloadByProductId.set(productId, item.requestedQuantity);
        }
      }

      const productIds = Array.from(payloadByProductId.keys());

      const existingRequested = productIds.length
        ? await requestedProductRepository.find({
            where: {
              distributionPointId: body.distributionPointId,
              productId: In(productIds),
            },
            relations: { product: true },
          })
        : [];

      const existingByProductId = new Map<string, PointRequestedProduct>();
      for (const requestedProduct of existingRequested) {
        existingByProductId.set(requestedProduct.productId, requestedProduct);
      }

      const toSave: PointRequestedProduct[] = [];
      const alreadyRequestedNames: string[] = [];

      for (const [
        productId,
        requestedQuantity,
      ] of payloadByProductId.entries()) {
        const existing = existingByProductId.get(productId);

        if (existing) {
          if (existing.status !== RequestedProductStatus.REMOVED) {
            alreadyRequestedNames.push(existing.product?.name ?? 'Produto');
            continue;
          }

          const nextRequested = requestedQuantity;
          const nextDonated = Math.max(
            0,
            Number(existing.donatedQuantity ?? 0),
          );

          const computedStatus = this.computeStatus(nextRequested, nextDonated);

          existing.requestedQuantity = nextRequested;
          existing.donatedQuantity = nextDonated;
          existing.status = computedStatus;
          existing.closesAt =
            computedStatus === RequestedProductStatus.FULL ? new Date() : null;

          toSave.push(existing);
          continue;
        }

        const computedStatus = this.computeStatus(requestedQuantity, 0);

        const entity = requestedProductRepository.create({
          distributionPointId: distributionPoint.id,
          productId,
          requestedQuantity,
          donatedQuantity: 0,
          status: computedStatus,
          closesAt:
            computedStatus === RequestedProductStatus.FULL ? new Date() : null,
        });

        toSave.push(entity);
      }

      if (alreadyRequestedNames.length) {
        const uniqueNames = Array.from(new Set(alreadyRequestedNames));
        throw new ConflictException(
          DistributionPointsMessagesHelper.PRODUCTS_ALREADY_REQUESTED(
            uniqueNames,
          ),
        );
      }

      return requestedProductRepository.save(toSave);
    });
  }

  async list(query: ListPointRequestedProductsDto) {
    const pagination = buildPagination(query, { createdAt: 'DESC' });

    const queryBuilder = this.repository
      .createQueryBuilder('requestedProduct')
      .leftJoinAndSelect('requestedProduct.product', 'product')
      .leftJoin('requestedProduct.point', 'point')
      .take(pagination.take)
      .skip(pagination.skip);

    const allowedSortBy = new Set([
      'createdAt',
      'updatedAt',
      'requestedQuantity',
      'donatedQuantity',
      'status',
      'productName',
      'pointTitle',
    ]);

    const sortField = Object.keys(pagination.order)[0];
    const sortDir = pagination.order[sortField];
    const sortBy = allowedSortBy.has(sortField) ? sortField : 'createdAt';

    if (sortBy === 'productName') {
      queryBuilder.orderBy('product.name', sortDir);
    } else if (sortBy === 'pointTitle') {
      queryBuilder.orderBy('point.title', sortDir);
    } else {
      queryBuilder.orderBy(`requestedProduct.${sortBy}`, sortDir);
    }

    if (query.distributionPointId) {
      queryBuilder.andWhere(
        'requestedProduct.distributionPointId = :distributionPointId',
        { distributionPointId: query.distributionPointId },
      );
    }

    if (query.productId) {
      queryBuilder.andWhere('requestedProduct.productId = :productId', {
        productId: query.productId,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('requestedProduct.status = :status', {
        status: query.status,
      });
    } else {
      queryBuilder.andWhere('requestedProduct.status != :removedStatus', {
        removedStatus: RequestedProductStatus.REMOVED,
      });
    }

    if (query.activeOnly === true) {
      queryBuilder.andWhere('requestedProduct.status IN (:...st)', {
        st: [RequestedProductStatus.OPEN, RequestedProductStatus.FULL],
      });
    }

    if (query.q?.trim()) {
      const q = query.q.trim();
      queryBuilder.andWhere('product.name ILIKE :q OR product.slug ILIKE :q', {
        q: `%${q}%`,
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages: Math.ceil(total / pagination.limit),
    };
  }

  async findById(requestedProductId: string): Promise<PointRequestedProduct> {
    const requestedPoint = await this.repository.findOne({
      where: { id: requestedProductId },
      relations: { product: true },
    });

    if (!requestedPoint) {
      throw new NotFoundException(
        PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
      );
    }

    return requestedPoint;
  }

  async update(
    requestedProductId: string,
    body: UpdatePointRequestedProductDto,
  ): Promise<PointRequestedProduct> {
    return this.dataSource.transaction(async (transactionManager) => {
      const requestedProductRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );
      const productRepository = transactionManager.getRepository(Product);

      const requestedPoint = await requestedProductRepository
        .createQueryBuilder('requestedProduct')
        .setLock('pessimistic_write')
        .where('requestedProduct.id = :id', { id: requestedProductId })
        .getOne();

      if (!requestedPoint) {
        throw new NotFoundException(
          PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
        );
      }

      if (body.requestedQuantity !== undefined) {
        requestedPoint.requestedQuantity = body.requestedQuantity;
      }

      if (body.productName !== undefined) {
        if (!requestedPoint.productId) {
          throw new NotFoundException(ProductMessagesHelper.PRODUCT_NOT_FOUND);
        }

        const product = await productRepository
          .createQueryBuilder('product')
          .setLock('pessimistic_write')
          .where('product.id = :id', { id: requestedPoint.productId })
          .getOne();

        if (!product) {
          throw new NotFoundException(ProductMessagesHelper.PRODUCT_NOT_FOUND);
        }

        product.name = body.productName;
        await productRepository.save(product);
      }

      if (body.status) {
        requestedPoint.status = body.status;
      }

      if (body.closesAt !== undefined) {
        requestedPoint.closesAt = body.closesAt
          ? new Date(body.closesAt)
          : null;
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

      return requestedProductRepository.save(requestedPoint);
    });
  }

  async remove(requestedProductId: string): Promise<{ ok: true }> {
    const requestedPoint = await this.repository.findOne({
      where: { id: requestedProductId },
    });
    if (!requestedPoint)
      throw new NotFoundException(
        PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
      );

    requestedPoint.status = RequestedProductStatus.REMOVED;
    requestedPoint.closesAt = new Date();

    await this.repository.save(requestedPoint);

    return { ok: true };
  }

  async cancelAllDonationsForUser(
    userId: string,
    requestedProductId: string,
  ): Promise<{ ok: true }> {
    return this.dataSource.transaction(async (transactionManager) => {
      const donationRepository = transactionManager.getRepository(Donation);
      const requestedProductRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );

      const request = await requestedProductRepository
        .createQueryBuilder('requestedProduct')
        .setLock('pessimistic_write')
        .where('requestedProduct.id = :id', { id: requestedProductId })
        .getOne();

      if (!request) {
        throw new NotFoundException(
          PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
        );
      }

      const donations = await donationRepository.find({
        where: {
          userId,
          requestedProductId,
          status: DonationStatus.ACTIVE,
        },
      });

      if (!donations.length) {
        return { ok: true };
      }

      const totalCancelQuantity = donations.reduce(
        (sum, d) => sum + Number(d.quantity ?? 0),
        0,
      );

      for (const donation of donations) {
        donation.status = DonationStatus.CANCELED;
      }
      await donationRepository.save(donations);

      const requestedQuantity = Number(request.requestedQuantity ?? 0);
      const donatedQuantity = Number(request.donatedQuantity ?? 0);

      const nextDonated = Math.max(0, donatedQuantity - totalCancelQuantity);

      const nextStatus =
        request.status === RequestedProductStatus.REMOVED
          ? RequestedProductStatus.REMOVED
          : this.computeStatus(requestedQuantity, nextDonated);

      request.donatedQuantity = nextDonated;
      request.status = nextStatus;
      request.closesAt =
        nextStatus === RequestedProductStatus.FULL
          ? (request.closesAt ?? new Date())
          : null;

      await requestedProductRepository.save(request);

      return { ok: true };
    });
  }

  async confirmDeliveryAllDonations(
    requestedProductId: string,
  ): Promise<{ ok: true }> {
    return this.dataSource.transaction(async (transactionManager) => {
      const requestedProductRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );
      const donationRepository = transactionManager.getRepository(Donation);

      const requestedProduct = await requestedProductRepository
        .createQueryBuilder('requestedProduct')
        .setLock('pessimistic_write')
        .where('requestedProduct.id = :id', { id: requestedProductId })
        .getOne();

      if (!requestedProduct) {
        throw new NotFoundException(
          PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
        );
      }

      const donatedQuantity = Number(requestedProduct.donatedQuantity ?? 0);
      const deliveredQuantity = Number(requestedProduct.deliveredQuantity ?? 0);

      if (donatedQuantity <= 0) {
        throw new ConflictException(
          PointRequestedProductsMessagesHelper.GOAL_ALREADY_REACHED,
        );
      }

      if (deliveredQuantity > donatedQuantity) {
        requestedProduct.deliveredQuantity = donatedQuantity;
      }

      const donations = await donationRepository.find({
        where: { requestedProductId },
      });

      if (donations.length) {
        for (const donation of donations) {
          if (donation.status !== DonationStatus.CANCELED) {
            donation.status = DonationStatus.DELIVERED;
          }
        }
        await donationRepository.save(donations);
      }

      requestedProduct.deliveredQuantity = donatedQuantity;
      requestedProduct.status = RequestedProductStatus.DELIVERED;
      requestedProduct.closesAt = requestedProduct.closesAt ?? new Date();

      await requestedProductRepository.save(requestedProduct);

      return { ok: true };
    });
  }
}
