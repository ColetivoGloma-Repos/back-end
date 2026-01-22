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
import {
  CreateDonationDto,
  ListDonationsDto,
  UpdateDonationDto,
} from '../dto/donation';
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

  async create(body: CreateDonationDto): Promise<Donation> {
    const quantity = Number(body.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0)
      throw new ConflictException(
        PointRequestedProductsMessagesHelper.INVALID_QUANTITY_SOLICITED,
      );

    const user = await this.usersRepository.findOne({
      where: { id: body.userId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    return this.dataSource.transaction(async (transactionManager) => {
      const requestedPointRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );
      const donationRepository = transactionManager.getRepository(Donation);

      const req = await requestedPointRepository
        .createQueryBuilder('r')
        .setLock('pessimistic_write')
        .where('r.id = :id', { id: body.requestedProductId })
        .getOne();

      if (!req)
        throw new NotFoundException(
          PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
        );

      if (req.status !== RequestedProductStatus.OPEN) {
        throw new ConflictException(
          PointRequestedProductsMessagesHelper.PRODUCT_NOT_ACEPTING_DONATIONS,
        );
      }

      const requestedQuantity = Number(req.requestedQuantity ?? 0);
      const donatedQuantity = Number(req.donatedQuantity ?? 0);
      const remaining = Math.max(0, requestedQuantity - donatedQuantity);

      if (remaining <= 0) {
        req.status = RequestedProductStatus.FULL;
        req.closesAt = req.closesAt ?? new Date();
        await requestedPointRepository.save(req);
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
        userId: body.userId,
        requestedProductId: body.requestedProductId,
        pointId: req.pointId,
        quantity,
        status: DonationStatus.ACTIVE,
      });

      const saved = await donationRepository.save(donation);

      const nextDonated = donatedQuantity + quantity;
      const nextStatus = this.computeStatus(requestedQuantity, nextDonated);

      req.donatedQuantity = nextDonated;
      req.status = nextStatus;
      req.closesAt =
        nextStatus === RequestedProductStatus.FULL
          ? (req.closesAt ?? new Date())
          : null;

      await requestedPointRepository.save(req);

      return saved;
    });
  }

  async list(query: ListDonationsDto) {
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10)));
    const offset = Math.max(0, Number(query.offset ?? 0));
    const skip = offset;

    const page = Math.floor(skip / limit) + 1;

    const queryBuilder = this.repository
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.user', 'user')
      .leftJoinAndSelect('d.requestedProduct', 'rp')
      .leftJoinAndSelect('rp.product', 'product')
      .leftJoinAndSelect('rp.point', 'point')
      .take(limit)
      .skip(skip);

    if (query.pointId)
      queryBuilder.andWhere('d.pointId = :pointId', { pointId: query.pointId });
    if (query.userId)
      queryBuilder.andWhere('d.userId = :userId', { userId: query.userId });
    if (query.requestedProductId) {
      queryBuilder.andWhere('d.requestedProductId = :requestedProductId', {
        requestedProductId: query.requestedProductId,
      });
    }

    if (query.status)
      queryBuilder.andWhere('d.status = :status', { status: query.status });

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

    if (sortBy === 'productName') queryBuilder.orderBy('product.name', sortDir);
    else if (sortBy === 'pointTitle')
      queryBuilder.orderBy('point.title', sortDir);
    else if (sortBy === 'userName') queryBuilder.orderBy('user.name', sortDir);
    else queryBuilder.orderBy(`d.${sortBy}`, sortDir);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Donation> {
    const donation = await this.repository.findOne({
      where: { id },
      relations: {
        user: true,
        requestedProduct: { product: true, point: true },
      },
    });
    if (!donation)
      throw new NotFoundException(DonationMessagesHelper.DONATION_NOT_FOUND);
    return donation;
  }

  async update(id: string, body: UpdateDonationDto): Promise<Donation> {
    const nextQuantity =
      body.quantity !== undefined ? Number(body.quantity) : undefined;
    if (
      nextQuantity !== undefined &&
      (!Number.isFinite(nextQuantity) || nextQuantity < 0)
    ) {
      throw new ConflictException(
        PointRequestedProductsMessagesHelper.INVALID_QUANTITY_SOLICITED,
      );
    }

    return this.dataSource.transaction(async (transactionManager) => {
      const donationRepository = transactionManager.getRepository(Donation);
      const requestedPointRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );

      const donation = await donationRepository.findOne({
        where: { id },
      });
      if (!donation)
        throw new NotFoundException(DonationMessagesHelper.DONATION_NOT_FOUND);
      if (donation.status !== DonationStatus.ACTIVE)
        throw new ConflictException(DonationMessagesHelper.DONATION_NOT_ACTIVE);

      if (nextQuantity === undefined) return donation;

      const currentQuantity = Number(donation.quantity ?? 0);
      if (nextQuantity === currentQuantity) return donation;

      const req = await requestedPointRepository
        .createQueryBuilder('r')
        .setLock('pessimistic_write')
        .where('r.id = :id', { id: donation.requestedProductId })
        .getOne();

      if (!req)
        throw new NotFoundException(
          PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
        );

      const requestedQuantity = Number(req.requestedQuantity ?? 0);
      const donatedQuantity = Number(req.donatedQuantity ?? 0);

      if (nextQuantity > currentQuantity) {
        if (req.status !== RequestedProductStatus.OPEN) {
          throw new ConflictException(
            PointRequestedProductsMessagesHelper.PRODUCT_NOT_ACEPTING_DONATIONS,
          );
        }

        const add = nextQuantity - currentQuantity;
        const remaining = Math.max(0, requestedQuantity - donatedQuantity);

        if (remaining <= 0) {
          req.status = RequestedProductStatus.FULL;
          req.closesAt = req.closesAt ?? new Date();
          await requestedPointRepository.save(req);
          throw new ConflictException(
            PointRequestedProductsMessagesHelper.GOAL_ALREADY_REACHED,
          );
        }

        if (add > remaining) {
          throw new ConflictException(
            PointRequestedProductsMessagesHelper.QUANTITY_EXCEEDS_REQUESTED(
              remaining,
            ),
          );
        }

        donation.quantity = nextQuantity;
        const savedDonation = await donationRepository.save(donation);

        const nextDonated = donatedQuantity + add;
        const nextStatus = this.computeStatus(requestedQuantity, nextDonated);

        req.donatedQuantity = nextDonated;
        req.status = nextStatus;
        req.closesAt =
          nextStatus === RequestedProductStatus.FULL
            ? (req.closesAt ?? new Date())
            : null;

        await requestedPointRepository.save(req);

        return savedDonation;
      }

      const sub = currentQuantity - nextQuantity;

      donation.quantity = nextQuantity;
      const savedDonation = await donationRepository.save(donation);

      const nextDonated = Math.max(0, donatedQuantity - sub);
      const nextStatus =
        req.status === RequestedProductStatus.REMOVED
          ? RequestedProductStatus.REMOVED
          : this.computeStatus(requestedQuantity, nextDonated);

      req.donatedQuantity = nextDonated;
      req.status = nextStatus;
      req.closesAt =
        nextStatus === RequestedProductStatus.FULL
          ? (req.closesAt ?? new Date())
          : null;

      await requestedPointRepository.save(req);

      return savedDonation;
    });
  }

  async cancel(id: string): Promise<{ ok: true }> {
    return this.dataSource.transaction(async (transactionManager) => {
      const donationRepository = transactionManager.getRepository(Donation);
      const requestedPointRepository = transactionManager.getRepository(
        PointRequestedProduct,
      );

      const donation = await donationRepository.findOne({
        where: { id },
      });
      if (!donation)
        throw new NotFoundException(DonationMessagesHelper.DONATION_NOT_FOUND);
      if (donation.status !== DonationStatus.ACTIVE) return { ok: true };

      const request = await requestedPointRepository
        .createQueryBuilder('r')
        .setLock('pessimistic_write')
        .where('r.id = :id', { id: donation.requestedProductId })
        .getOne();

      if (!request)
        throw new NotFoundException(
          PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
        );

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

      await requestedPointRepository.save(request);

      return { ok: true };
    });
  }
}
