import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Donation } from '../entities/donation.entity';
import { PointRequestedProduct } from '../entities/point-requested-product.entity';
import { User } from 'src/modules/auth/entities/auth.enity';
import { DonationStatus, RequestedProductStatus } from '../shared';
import { CreateDonationDto, ListDonationsDto } from '../dto/donation';
import {
  DistributionPointsMessagesHelper,
  DonationMessagesHelper,
  PointRequestedProductsMessagesHelper,
} from '../shared/helpers';
import { buildPagination } from 'src/common/helpers';
import { EAuthRoles } from 'src/modules/auth/enums/auth';
import { DistributionPoint } from '../entities';

type SecurityActionType = 'cancel' | 'delivery';
interface ISecurity {
  roles?: EAuthRoles[];
  userId?: string;
}

@Injectable()
export class DonationsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Donation)
    private readonly repository: Repository<Donation>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private validatePermission(
    distributionPoint: DistributionPoint,
    donation: Donation,
    action: SecurityActionType,
    security?: ISecurity,
  ): void {
    const { roles, userId } = security || {};

    if (!userId) return;

    const isAdmin = roles?.includes(EAuthRoles.ADMIN);
    const isCoordinator = distributionPoint.ownerId === userId;

    const messages = {
      cancel: DonationMessagesHelper.DONATION_NOT_FOUND,
      delivery:
        PointRequestedProductsMessagesHelper.ONLY_OWNER_OR_ADMIN_CAN_CONFIRM_DELIVERY,
    };

    if (action === 'cancel') {
      const isDonor = donation.userId === userId;

      if (!isAdmin && !isCoordinator && !isDonor) {
        throw new NotFoundException(messages['cancel']);
      }
    } else if (action === 'delivery') {
      if (!isAdmin && !isCoordinator) {
        throw new ForbiddenException(messages['delivery']);
      }
    }
  }

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
    body: CreateDonationDto,
    security?: { roles?: EAuthRoles[]; userId?: string },
  ): Promise<Donation> {
    const quantity = body.quantity;
    if (!Number.isFinite(quantity) || quantity <= 0)
      throw new ConflictException(
        PointRequestedProductsMessagesHelper.INVALID_QUANTITY_SOLICITED,
      );

    const { roles, userId: authUserId } = security || {};
    const isAdmin = roles?.includes(EAuthRoles.ADMIN);

    const donorId = body.userId || authUserId;
    const isThirdPartyDonation = authUserId && donorId !== authUserId;

    if (isThirdPartyDonation && !isAdmin) {
      throw new ForbiddenException(
        DonationMessagesHelper.ONLY_ADMIN_CAN_CREATE_FOR_OTHERS,
      );
    }

    const user = await this.usersRepository.findOne({
      where: { id: donorId },
    });
    if (!user)
      throw new NotFoundException(DonationMessagesHelper.USER_NOT_FOUND);

    return this.dataSource.transaction(async (transactionManager) => {
      const requestedProductRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );
      const donationRepository = transactionManager.getRepository(Donation);

      const requestedProduct = await requestedProductRepository
        .createQueryBuilder('requestedProduct')
        .setLock('pessimistic_write')
        .where('requestedProduct.id = :id', { id: body.requestedProductId })
        .getOne();

      if (!requestedProduct)
        throw new NotFoundException(
          PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
        );

      if (requestedProduct.status !== RequestedProductStatus.OPEN) {
        throw new ConflictException(
          PointRequestedProductsMessagesHelper.PRODUCT_NOT_ACEPTING_DONATIONS,
        );
      }

      const requestedQuantity = Number(requestedProduct.requestedQuantity ?? 0);
      const donatedQuantity = Number(requestedProduct.donatedQuantity ?? 0);
      const remaining = Math.max(0, requestedQuantity - donatedQuantity);

      if (remaining <= 0) {
        requestedProduct.status = RequestedProductStatus.FULL;
        requestedProduct.closesAt = requestedProduct.closesAt ?? new Date();
        await requestedProductRepository.save(requestedProduct);
        throw new ConflictException(
          PointRequestedProductsMessagesHelper.GOAL_ALREADY_REACHED,
        );
      }

      if (quantity > remaining) {
        throw new ConflictException(
          PointRequestedProductsMessagesHelper.QUANTITY_EXCEEDS_REQUESTED(
            remaining,
          ),
        );
      }

      const donation = donationRepository.create({
        userId: donorId,
        requestedProductId: body.requestedProductId,
        distributionPointId: requestedProduct.distributionPointId,
        quantity,
        status: DonationStatus.ACTIVE,
      });

      const saved = await donationRepository.save(donation);

      const nextDonated = donatedQuantity + quantity;
      const nextStatus = this.computeStatus(requestedQuantity, nextDonated);

      requestedProduct.donatedQuantity = nextDonated;
      requestedProduct.status = nextStatus;
      requestedProduct.closesAt =
        nextStatus === RequestedProductStatus.FULL
          ? (requestedProduct.closesAt ?? new Date())
          : null;

      await requestedProductRepository.save(requestedProduct);

      return saved;
    });
  }

  async list(
    query: ListDonationsDto,
    security?: { roles?: EAuthRoles[]; userId?: string },
  ) {
    const pagination = buildPagination(query, { createdAt: 'DESC' });

    const queryBuilder = this.repository
      .createQueryBuilder('donation')
      .leftJoinAndSelect('donation.user', 'user')
      .leftJoin('donation.requestedProduct', 'requestedProduct')
      .leftJoin('requestedProduct.product', 'product')
      .leftJoin('requestedProduct.point', 'point')
      .select([
        'donation',
        'user.name',
        'user.email',
        'user.phone',
        'requestedProduct.id',
        'product.id',
        'product.name',
        'product.unit',
        'point.id',
        'point.title',
      ])
      .take(pagination.take)
      .skip(pagination.skip);

    if (query.distributionPointId) {
      queryBuilder.andWhere(
        'donation.distributionPointId = :distributionPointId',
        { distributionPointId: query.distributionPointId },
      );
    }

    if (query.requestedProductId) {
      queryBuilder.andWhere(
        'donation.requestedProductId = :requestedProductId',
        { requestedProductId: query.requestedProductId },
      );
    }

    if (query.userId) {
      queryBuilder.andWhere('donation.userId = :targetUserId', {
        targetUserId: query.userId,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('donation.status = :status', {
        status: query.status,
      });
    } else if (query.excludeStatus) {
      queryBuilder.andWhere('donation.status != :excludeStatus', {
        excludeStatus: query.excludeStatus,
      });
    } else {
      queryBuilder.andWhere('donation.status != :canceledStatus', {
        canceledStatus: DonationStatus.CANCELED,
      });
    }

    if (query.q?.trim()) {
      const q = query.q.trim();
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('product.name ILIKE :q', { q: `%${q}%` })
            .orWhere('product.slug ILIKE :q', { q: `%${q}%` })
            .orWhere('point.title ILIKE :q', { q: `%${q}%` })
            .orWhere('user.name ILIKE :q', { q: `%${q}%` })
            .orWhere('user.email ILIKE :q', { q: `%${q}%` });
        }),
      );
    }

    const { roles, userId: authUserId } = security || {};
    const isAdmin = roles?.includes(EAuthRoles.ADMIN);
    const isInternal = !authUserId;

    if (!isAdmin && !isInternal) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('donation.userId = :authUserId', { authUserId }).orWhere(
            'point.ownerId = :authUserId',
            { authUserId },
          );
        }),
      );
    }

    const allowedSortBy = new Set([
      'createdAt',
      'updatedAt',
      'quantity',
      'status',
      'productName',
      'pointTitle',
      'userName',
    ]);

    const sortField = Object.keys(pagination.order)[0];
    const sortDir = pagination.order[sortField];
    const sortBy = allowedSortBy.has(sortField) ? sortField : 'createdAt';

    if (sortBy === 'productName') {
      queryBuilder.orderBy('product.name', sortDir);
    } else if (sortBy === 'pointTitle') {
      queryBuilder.orderBy('point.title', sortDir);
    } else if (sortBy === 'userName') {
      queryBuilder.orderBy('user.name', sortDir);
    } else {
      queryBuilder.orderBy(`donation.${sortBy}`, sortDir);
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

  async cancel(
    donationId: string,
    security?: { roles?: EAuthRoles[]; userId?: string },
  ): Promise<{ ok: true }> {
    return this.dataSource.transaction(async (transactionManager) => {
      const donationRepository = transactionManager.getRepository(Donation);
      const requestedProductRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );
      const distributionPointRepository =
        transactionManager.getRepository(DistributionPoint);

      const donation = await donationRepository
        .createQueryBuilder('donation')
        .setLock('pessimistic_write')
        .where('donation.id = :id', { id: donationId })
        .getOne();

      if (!donation) {
        throw new NotFoundException(DonationMessagesHelper.DONATION_NOT_FOUND);
      }

      const distributionPoint = await distributionPointRepository.findOne({
        where: { id: donation.distributionPointId },
        select: ['id', 'ownerId'],
      });

      if (!distributionPoint) {
        throw new NotFoundException(
          DistributionPointsMessagesHelper.POINT_NOT_FOUND,
        );
      }

      this.validatePermission(distributionPoint, donation, 'cancel', security);

      if (donation.status !== DonationStatus.ACTIVE) {
        return { ok: true };
      }

      const request = await requestedProductRepository
        .createQueryBuilder('requestedProduct')
        .setLock('pessimistic_write')
        .where('requestedProduct.id = :id', { id: donation.requestedProductId })
        .getOne();

      if (!request) {
        throw new NotFoundException(
          PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
        );
      }

      const requestedQuantity = Number(request.requestedQuantity ?? 0);
      const donatedQuantity = Number(request.donatedQuantity ?? 0);
      const quantityToCancel = Number(donation.quantity ?? 0);

      donation.status = DonationStatus.CANCELED;
      await donationRepository.save(donation);

      const nextDonated = Math.max(0, donatedQuantity - quantityToCancel);

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

  async delivered(
    donationId: string,
    security?: { roles?: EAuthRoles[]; userId?: string },
  ): Promise<Donation> {
    return this.dataSource.transaction(async (transactionManager) => {
      const donationRepository = transactionManager.getRepository(Donation);
      const requestedProductRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );
      const distributionPointRepository =
        transactionManager.getRepository(DistributionPoint);

      const donation = await donationRepository
        .createQueryBuilder('donation')
        .setLock('pessimistic_write')
        .where('donation.id = :id', { id: donationId })
        .getOne();

      if (!donation) {
        throw new NotFoundException(DonationMessagesHelper.DONATION_NOT_FOUND);
      }

      const distributionPoint = await distributionPointRepository.findOne({
        where: { id: donation.distributionPointId },
        select: ['id', 'ownerId'],
      });

      if (!distributionPoint) {
        throw new NotFoundException(
          DistributionPointsMessagesHelper.POINT_NOT_FOUND,
        );
      }

      this.validatePermission(
        distributionPoint,
        donation,
        'delivery',
        security,
      );

      if (donation.status === DonationStatus.CANCELED) {
        throw new ConflictException(DonationMessagesHelper.DONATION_NOT_FOUND);
      }

      if (donation.status === DonationStatus.DELIVERED) {
        return donation;
      }

      const requestedProduct = await requestedProductRepository
        .createQueryBuilder('requestedProduct')
        .setLock('pessimistic_write')
        .where('requestedProduct.id = :id', { id: donation.requestedProductId })
        .getOne();

      if (!requestedProduct) {
        throw new NotFoundException(
          PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
        );
      }

      const donatedQuantity = requestedProduct.donatedQuantity;
      const deliveredQuantity = requestedProduct.deliveredQuantity;
      const requestedQuantity = requestedProduct.requestedQuantity;

      if (deliveredQuantity >= donatedQuantity) {
        throw new ConflictException(
          PointRequestedProductsMessagesHelper.GOAL_ALREADY_REACHED,
        );
      }

      donation.status = DonationStatus.DELIVERED;
      const savedDonation = await donationRepository.save(donation);

      const nextDelivered = deliveredQuantity + 1;

      if (nextDelivered > donatedQuantity) {
        throw new ConflictException(
          PointRequestedProductsMessagesHelper.GOAL_ALREADY_REACHED,
        );
      }

      requestedProduct.deliveredQuantity = nextDelivered;

      if (nextDelivered >= requestedQuantity) {
        requestedProduct.status = RequestedProductStatus.DELIVERED;
        requestedProduct.closesAt = requestedProduct.closesAt ?? new Date();
      }

      await requestedProductRepository.save(requestedProduct);

      return savedDonation;
    });
  }
}
