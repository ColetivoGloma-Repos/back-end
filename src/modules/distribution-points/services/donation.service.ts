import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Donation } from '../entities/donation.entity';
import { PointRequestedProduct } from '../entities/point-requested-product.entity';
import { User } from 'src/modules/auth/entities/auth.enity';
import { DonationStatus, RequestedProductStatus } from '../shared';
import { CreateDonationDto, ListDonationsDto } from '../dto/donation';
import {
  DonationMessagesHelper,
  PointRequestedProductsMessagesHelper,
} from '../shared/helpers';

@Injectable()
export class DonationsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Donation)
    private readonly repository: Repository<Donation>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

  async create(userId: string, body: CreateDonationDto): Promise<Donation> {
    const quantity = Number(body.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0)
      throw new ConflictException(
        PointRequestedProductsMessagesHelper.INVALID_QUANTITY_SOLICITED,
      );

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

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
        userId,
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

  async list(userId: string, query: ListDonationsDto) {
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10)));
    const offset = Math.max(0, Number(query.offset ?? 0));
    const skip = offset;

    const page = Math.floor(skip / limit) + 1;

    const queryBuilder = this.repository
      .createQueryBuilder('donation')
      .leftJoinAndSelect('donation.user', 'user')
      .leftJoin('donation.requestedProduct', 'requestedProduct')
      .leftJoin('requestedProduct.product', 'product')
      .leftJoin('requestedProduct.point', 'point')
      .select(['donation', 'user.name', 'user.email'])
      .take(limit)
      .skip(skip);

    if (query.distributionPointId) {
      queryBuilder.andWhere(
        'donation.distributionPointId = :distributionPointId',
        { distributionPointId: query.distributionPointId },
      );
    }

    queryBuilder.andWhere('donation.userId = :userId', { userId });

    if (query.requestedProductId) {
      queryBuilder.andWhere(
        'donation.requestedProductId = :requestedProductId',
        { requestedProductId: query.requestedProductId },
      );
    }

    if (query.status) {
      queryBuilder.andWhere('donation.status = :status', {
        status: query.status,
      });
    } else {
      queryBuilder.andWhere('donation.status != :canceledStatus', {
        canceledStatus: DonationStatus.CANCELED,
      });
    }

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      queryBuilder.andWhere(
        '(product.name ILIKE :q OR product.slug ILIKE :q OR point.title ILIKE :q OR user.name ILIKE :q OR user.email ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    const sortByRaw = (query.sortBy ?? 'createdAt').toString();
    const sortRaw = (query.sort ?? 'DESC').toString().toUpperCase();
    const sortDir = sortRaw === 'ASC' ? 'ASC' : 'DESC';

    const allowedSortBy = new Set([
      'createdAt',
      'updatedAt',
      'quantity',
      'status',
      'productName',
      'pointTitle',
      'userName',
    ]);

    const sortBy = allowedSortBy.has(sortByRaw) ? sortByRaw : 'createdAt';

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
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async cancel(userId: string, donationId: string): Promise<{ ok: true }> {
    return this.dataSource.transaction(async (transactionManager) => {
      const donationRepository = transactionManager.getRepository(Donation);
      const requestedProductRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );

      const donation = await donationRepository.findOne({
        where: { id: donationId },
      });
      if (!donation) {
        throw new NotFoundException(DonationMessagesHelper.DONATION_NOT_FOUND);
      }

      if (donation.userId !== userId) {
        throw new NotFoundException(DonationMessagesHelper.DONATION_NOT_FOUND);
      }

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
      const quantity = Number(donation.quantity ?? 0);

      donation.status = DonationStatus.CANCELED;
      await donationRepository.save(donation);

      const nextDonated = Math.max(0, donatedQuantity - quantity);
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

  async confirmDelivery(donationId: string): Promise<Donation> {
    return this.dataSource.transaction(async (transactionManager) => {
      const donationRepository = transactionManager.getRepository(Donation);
      const requestedProductRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );

      const donation = await donationRepository
        .createQueryBuilder('donation')
        .setLock('pessimistic_write')
        .where('donation.id = :id', { id: donationId })
        .getOne();

      if (!donation) {
        throw new NotFoundException(DonationMessagesHelper.DONATION_NOT_FOUND);
      }

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
