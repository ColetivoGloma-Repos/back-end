import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  DataSource,
  EntityManager,
  FindOneOptions,
  In,
  Repository,
} from 'typeorm';
import { PointRequestedProduct } from '../entities/point-requested-product.entity';
import { DistributionPoint } from '../entities/distribution-point.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { DonationStatus, RequestedProductStatus } from '../shared';
import {
  CreatePointRequestedProductDto,
  ListPointRequestedProductsDto,
  UpdatePointRequestedProductDto,
} from '../dto/point-requested-product';
import {
  DistributionPointsMessagesHelper,
  PointRequestedProductsMessagesHelper,
} from '../shared/helpers';
import { ProductsService } from 'src/modules/products/products.service';
import { Donation } from '../entities';
import { buildPagination } from 'src/common/helpers';
import { EAuthRoles } from 'src/modules/auth/enums/auth';
import { NotificationService } from 'src/modules/notifications/notification.service';
import { NotificationType } from 'src/modules/notifications/enums/notification-type.enum';
import { NotificationSeverity } from 'src/modules/notifications/enums/notification-severity.enum';
import { DistributionPointService } from './distribution-point.service';

type SecurityAction = 'create' | 'update' | 'delete' | 'delivery';
interface ISecurity {
  roles?: EAuthRoles[];
  userId?: string;
}

@Injectable()
export class PointRequestedProductsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(PointRequestedProduct)
    private readonly repository: Repository<PointRequestedProduct>,

    private readonly productsService: ProductsService,

    private readonly notificationService: NotificationService,

    @Inject(forwardRef(() => DistributionPointService))
    private readonly distributionPointService: DistributionPointService,
  ) {}

  private validateSecurity(
    distributionPoint: DistributionPoint,
    action: SecurityAction,
    security?: ISecurity,
  ): void {
    const { roles, userId } = security || {};

    const hasAuthData = roles !== undefined || userId !== undefined;
    if (!hasAuthData) return;

    const isAdmin = roles?.includes(EAuthRoles.ADMIN);
    const isOwner = userId && distributionPoint.ownerId === userId;

    if (!isAdmin && !isOwner) {
      const messages = {
        create:
          PointRequestedProductsMessagesHelper.ONLY_OWNER_OR_ADMIN_CAN_CREATE,
        update:
          PointRequestedProductsMessagesHelper.ONLY_OWNER_OR_ADMIN_CAN_UPDATE,
        delete:
          PointRequestedProductsMessagesHelper.ONLY_OWNER_OR_ADMIN_CAN_DELETE,
        delivery:
          PointRequestedProductsMessagesHelper.ONLY_OWNER_OR_ADMIN_CAN_CONFIRM_DELIVERY,
      };

      throw new ForbiddenException(messages[action]);
    }
  }

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
    security?: ISecurity,
  ): Promise<PointRequestedProduct[]> {
    const distributionPoint = await this.distributionPointService.findById(
      body.distributionPointId,
    );

    this.validateSecurity(distributionPoint, 'create', security);

    const requestedProducts = Array.isArray(body.requestedProducts)
      ? body.requestedProducts
      : [];

    if (!requestedProducts.length) {
      throw new ConflictException(
        DistributionPointsMessagesHelper.REPORT_ONE_PRODUCT,
      );
    }

    const transactionResult = await this.dataSource.transaction(
      async (transactionManager) => {
        const requestedProductRepository = transactionManager.getRepository(
          PointRequestedProduct,
        );
        const productsRepository = transactionManager.getRepository(Product);

        const normalizedProducts = requestedProducts.map((item) => {
          const slug = this.productsService.normalizeSlug(
            item.slug || item.name,
          );

          return {
            slug,
            name: item.name,
            unit: item.unit,
            requestedQuantity: Number(item.requestedQuantity ?? 0),
          };
        });

        const slugs = Array.from(
          new Set(normalizedProducts.map((x) => x.slug)),
        );

        const existingProducts = await productsRepository.find({
          where: { slug: In(slugs) },
        });

        const productMap = new Map<string, Product>();
        existingProducts.forEach((p) => productMap.set(p.slug, p));

        const productsToCreate: Product[] = [];

        for (const product of normalizedProducts) {
          if (!productMap.has(product.slug)) {
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
            productMap.set(product.slug, product);
          }
        }

        const payloadByProductId = new Map<string, number>();

        for (const item of normalizedProducts) {
          const product = productMap.get(item.slug);
          if (!product) continue;

          const current = payloadByProductId.get(product.id) || 0;
          payloadByProductId.set(product.id, current + item.requestedQuantity);
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
        existingRequested.forEach((r) =>
          existingByProductId.set(r.productId, r),
        );

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

            const computedStatus = this.computeStatus(
              nextRequested,
              nextDonated,
            );

            existing.requestedQuantity = nextRequested;
            existing.donatedQuantity = nextDonated;
            existing.status = computedStatus;
            existing.closesAt =
              computedStatus === RequestedProductStatus.FULL
                ? new Date()
                : null;

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
              computedStatus === RequestedProductStatus.FULL
                ? new Date()
                : null,
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

        const savedRequests = await requestedProductRepository.save(toSave);

        return {
          savedRequests,
          pointTitle: distributionPoint.title,
          productNames: savedRequests
            .map(
              (r) =>
                productMap.get(
                  Array.from(productMap.values()).find(
                    (p) => p.id === r.productId,
                  )?.slug || '',
                )?.name,
            )
            .filter(Boolean) as string[],
        };
      },
    );

    const { savedRequests, pointTitle, productNames } = transactionResult;

    if (savedRequests.length > 0) {
      const maxItemsToShow = 2;
      let itemsText = productNames.slice(0, maxItemsToShow).join(', ');

      if (productNames.length > maxItemsToShow) {
        itemsText += ` e mais ${productNames.length - maxItemsToShow} itens`;
      }

      await this.notificationService
        .notifyAllUsers({
          type: NotificationType.REQUESTED_PRODUCT,
          title: 'Precisamos da sua ajuda!',
          message: `O ponto "${pointTitle}" está precisando de: ${itemsText}.`,
          severity: NotificationSeverity.INFO,
        })
        .catch((err) => console.error('Erro ao notificar em background', err));
    }

    return savedRequests;
  }

  async list(query: ListPointRequestedProductsDto, manager?: EntityManager) {
    const pagination = buildPagination(query, { createdAt: 'DESC' });

    const queryBuilder = this.repository
      .createQueryBuilder('requestedProduct')
      .innerJoinAndSelect('requestedProduct.product', 'product')
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
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('product.name ILIKE :q', { q: `%${q}%` }).orWhere(
            'product.slug ILIKE :q',
            { q: `%${q}%` },
          );
        }),
      );
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

  async findById(
    requestedProductId: string,
    relations?: FindOneOptions<PointRequestedProduct>['relations'],
  ): Promise<PointRequestedProduct> {
    const requestedPoint = await this.repository.findOne({
      where: { id: requestedProductId },
      relations,
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
    security?: ISecurity,
  ): Promise<PointRequestedProduct> {
    const transactionResult = await this.dataSource.transaction(
      async (transactionManager) => {
        const requestedProductRepository = transactionManager.getRepository(
          PointRequestedProduct,
        );
        const productRepository = transactionManager.getRepository(Product);

        const requestedProduct = await requestedProductRepository
          .createQueryBuilder('requestedProduct')
          .setLock('pessimistic_write')
          .innerJoinAndSelect('requestedProduct.point', 'point')
          .innerJoinAndSelect('requestedProduct.product', 'product')
          .where('requestedProduct.id = :id', { id: requestedProductId })
          .getOne();

        if (!requestedProduct) {
          throw new NotFoundException(
            PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
          );
        }

        if (!requestedProduct.point) {
          throw new NotFoundException(
            DistributionPointsMessagesHelper.POINT_NOT_FOUND,
          );
        }

        this.validateSecurity(requestedProduct.point, 'update', security);

        const oldRequestedQuantity = requestedProduct.requestedQuantity;
        let productNameChanged = false;

        if (body.requestedQuantity !== undefined) {
          const donated = requestedProduct.donatedQuantity || 0;
          const nextRequested = body.requestedQuantity;

          if (nextRequested < donated) {
            throw new BadRequestException(
              PointRequestedProductsMessagesHelper.REQUESTED_QUANTITY_LESS_THAN_DONATED,
            );
          }

          requestedProduct.requestedQuantity = body.requestedQuantity;
        }

        if (body.productName !== undefined && requestedProduct.product) {
          const product = await productRepository
            .createQueryBuilder('product')
            .setLock('pessimistic_write')
            .where('product.id = :id', { id: requestedProduct.productId })
            .getOne();

          if (product) {
            product.name = body.productName;
            await productRepository.save(product);

            requestedProduct.product.name = body.productName;
            productNameChanged = true;
          }
        }

        if (body.status) {
          requestedProduct.status = body.status;
        }

        if (body.closesAt !== undefined) {
          requestedProduct.closesAt = body.closesAt
            ? new Date(body.closesAt)
            : null;
        }

        const nextStatus =
          requestedProduct.status === RequestedProductStatus.REMOVED
            ? RequestedProductStatus.REMOVED
            : this.computeStatus(
                Number(requestedProduct.requestedQuantity ?? 0),
                Number(requestedProduct.donatedQuantity ?? 0),
              );

        requestedProduct.status = nextStatus;
        requestedProduct.closesAt =
          nextStatus === RequestedProductStatus.FULL
            ? (requestedProduct.closesAt ?? new Date())
            : null;

        const savedRequestedProduct =
          await requestedProductRepository.save(requestedProduct);

        return {
          savedRequestedProduct,
          oldRequestedQuantity,
          productNameChanged,
          pointTitle: requestedProduct.point.title,
        };
      },
    );

    const {
      savedRequestedProduct,
      oldRequestedQuantity,
      pointTitle,
      productNameChanged,
    } = transactionResult;
    const currentQuantity = Number(
      savedRequestedProduct.requestedQuantity ?? 0,
    );
    const productName = savedRequestedProduct.product?.name || 'Produto';

    let shouldNotify = false;
    let notificationTitle = 'Meta atualizada';
    let notificationMessage = `As necessidades do ponto ${pointTitle} foram atualizadas.`;

    if (currentQuantity > oldRequestedQuantity) {
      shouldNotify = true;
      notificationTitle = 'Precisamos de mais ajuda!';
      notificationMessage = `O ponto ${pointTitle} aumentou a meta de ${productName}. Ainda precisamos de doações!`;
    } else if (productNameChanged) {
      shouldNotify = true;
      notificationTitle = 'Correção de item';
      notificationMessage = `Houve uma correção na descrição do item ${productName} no ponto ${pointTitle}.`;
    }

    if (shouldNotify) {
      await this.notificationService
        .notifyAllUsers({
          type: NotificationType.REQUESTED_PRODUCT,
          title: notificationTitle,
          message: notificationMessage,
          severity: NotificationSeverity.INFO,
        })
        .catch((err) => console.error('Erro ao notificar em background', err));
    }

    return savedRequestedProduct;
  }

  async remove(
    requestedProductId: string,
    security?: ISecurity,
  ): Promise<{ ok: true }> {
    const requestedProduct = await this.findById(requestedProductId, {
      product: true,
    });

    const distributionPoint = await this.distributionPointService.findById(
      requestedProduct.distributionPointId,
    );

    this.validateSecurity(distributionPoint, 'delete', security);

    requestedProduct.status = RequestedProductStatus.REMOVED;
    requestedProduct.closesAt = new Date();

    await this.repository.save(requestedProduct);

    const productName = requestedProduct.product.name;
    const pointTitle = distributionPoint.title;

    await this.notificationService
      .notifyAllUsers({
        type: NotificationType.REQUESTED_PRODUCT,
        title: 'Meta Atualizada',
        message: `O ponto "${pointTitle}" não precisa mais de doações de ${productName} no momento.`,
        severity: NotificationSeverity.WARNING,
      })
      .catch((err) => console.error('Erro ao notificar em background', err));

    return { ok: true };
  }

  async cancelAllDonationsForUser(
    userId: string,
    requestedProductId: string,
  ): Promise<{ ok: true }> {
    const transactionResult = await this.dataSource.transaction(
      async (transactionManager) => {
        const donationRepository = transactionManager.getRepository(Donation);
        const requestedProductRepository = transactionManager.getRepository(
          PointRequestedProduct,
        );

        const requestedProduct = await requestedProductRepository
          .createQueryBuilder('requestedProduct')
          .setLock('pessimistic_write')
          .innerJoinAndSelect('requestedProduct.point', 'point')
          .innerJoinAndSelect('requestedProduct.product', 'product')
          .where('requestedProduct.id = :id', { id: requestedProductId })
          .getOne();

        if (!requestedProduct) {
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
          return null;
        }

        const totalCancelQuantity = donations.reduce(
          (sum, d) => sum + Number(d.quantity ?? 0),
          0,
        );

        for (const donation of donations) {
          donation.status = DonationStatus.CANCELED;
        }
        await donationRepository.save(donations);

        const requestedQuantity = Number(
          requestedProduct.requestedQuantity ?? 0,
        );
        const donatedQuantity = Number(requestedProduct.donatedQuantity ?? 0);

        const nextDonated = Math.max(0, donatedQuantity - totalCancelQuantity);

        const nextStatus =
          requestedProduct.status === RequestedProductStatus.REMOVED
            ? RequestedProductStatus.REMOVED
            : this.computeStatus(requestedQuantity, nextDonated);

        requestedProduct.donatedQuantity = nextDonated;
        requestedProduct.status = nextStatus;
        requestedProduct.closesAt =
          nextStatus === RequestedProductStatus.FULL
            ? (requestedProduct.closesAt ?? new Date())
            : null;

        await requestedProductRepository.save(requestedProduct);

        return {
          pointOwnerId: requestedProduct.point.ownerId,
          productName: requestedProduct.product?.name || 'Item',
          donorName: donations[0].user?.name || 'Um usuário',
          totalCanceled: totalCancelQuantity,
        };
      },
    );

    if (transactionResult) {
      const { pointOwnerId, productName, donorName, totalCanceled } =
        transactionResult;

      await this.notificationService
        .create({
          userId: pointOwnerId,
          type: NotificationType.REQUESTED_PRODUCT,
          title: 'Doação Cancelada',
          message: `${donorName} cancelou a doação de ${totalCanceled}x ${productName}.`,
          severity: NotificationSeverity.WARNING,
        })
        .catch((err) => console.error('Erro ao notificar em background', err));
    }

    return { ok: true };
  }

  async delivered(
    requestedProductId: string,
    security?: ISecurity,
  ): Promise<{ ok: true }> {
    const transactionResult = await this.dataSource.transaction(
      async (transactionManager) => {
        const requestedProductRepository = transactionManager.getRepository(
          PointRequestedProduct,
        );
        const donationRepository = transactionManager.getRepository(Donation);

        const requestedProduct = await requestedProductRepository
          .createQueryBuilder('requestedProduct')
          .setLock('pessimistic_write')
          .innerJoinAndSelect('requestedProduct.point', 'point')
          .innerJoinAndSelect('requestedProduct.product', 'product')
          .where('requestedProduct.id = :id', { id: requestedProductId })
          .getOne();

        if (!requestedProduct) {
          throw new NotFoundException(
            PointRequestedProductsMessagesHelper.SOLICITATION_NOT_FOUND,
          );
        }

        if (!requestedProduct.point) {
          throw new NotFoundException(
            DistributionPointsMessagesHelper.POINT_NOT_FOUND,
          );
        }

        this.validateSecurity(requestedProduct.point, 'delivery', security);

        const donatedQuantity = Number(requestedProduct.donatedQuantity ?? 0);
        const deliveredQuantity = Number(
          requestedProduct.deliveredQuantity ?? 0,
        );

        if (donatedQuantity <= 0) {
          throw new ConflictException(
            PointRequestedProductsMessagesHelper.GOAL_ALREADY_REACHED,
          );
        }

        if (deliveredQuantity > donatedQuantity) {
          requestedProduct.deliveredQuantity = donatedQuantity;
        }

        const donations = await donationRepository.find({
          where: {
            requestedProductId,
            status: DonationStatus.ACTIVE,
          },
          select: ['id', 'userId'],
        });

        if (donations.length) {
          for (const donation of donations) {
            donation.status = DonationStatus.DELIVERED;
          }
          await donationRepository.save(donations);
        }

        requestedProduct.deliveredQuantity = donatedQuantity;
        requestedProduct.status = RequestedProductStatus.DELIVERED;
        requestedProduct.closesAt = requestedProduct.closesAt ?? new Date();

        await requestedProductRepository.save(requestedProduct);

        const uniqueUserIds = [...new Set(donations.map((d) => d.userId))];

        return {
          userIds: uniqueUserIds,
          pointTitle: requestedProduct.point.title,
          productName: requestedProduct.product?.name || 'Item',
        };
      },
    );

    const { userIds, pointTitle, productName } = transactionResult;

    if (userIds.length > 0) {
      await this.notificationService
        .notifyMany(userIds, {
          type: NotificationType.REQUESTED_PRODUCT,
          title: 'Entrega Confirmada!',
          message: `Sua doação de ${productName} foi recebida pelo ponto "${pointTitle}". Muito obrigado!`,
          severity: NotificationSeverity.INFO,
        })
        .catch((err) => console.error('Erro ao notificar em background', err));
    }

    return { ok: true };
  }
}
