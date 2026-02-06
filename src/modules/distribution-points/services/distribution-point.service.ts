import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsRelations, Repository } from 'typeorm';
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
import { buildPagination } from 'src/common/helpers';
import { getCoordinates } from '../../../common/utils';
import { EAuthRoles } from 'src/modules/auth/enums/auth';
import { NotificationService } from 'src/modules/notifications/notification.service';
import { NotificationType } from 'src/modules/notifications/enums/notification-type.enum';
import { NotificationSeverity } from 'src/modules/notifications/enums/notification-severity.enum';

type SecurityActionType = 'update' | 'delete';
interface ISecurity {
  roles?: EAuthRoles[];
  userId?: string;
}

@Injectable()
export class DistributionPointService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(DistributionPoint)
    private readonly repository: Repository<DistributionPoint>,

    private readonly productsService: ProductsService,

    @Inject(forwardRef(() => PointRequestedProductsService))
    private readonly requestedProductService: PointRequestedProductsService,

    private readonly notificationService: NotificationService,
  ) {}

  private validateSecurity(
    distributionPoint: DistributionPoint,
    action: SecurityActionType,
    security?: ISecurity,
  ): void {
    const { roles, userId } = security || {};

    const hasAuthData = roles !== undefined || userId !== undefined;
    if (!hasAuthData) return;

    const isAdmin = roles?.includes(EAuthRoles.ADMIN);
    const isOwner = userId && distributionPoint.ownerId === userId;

    if (!isAdmin && !isOwner) {
      const message =
        action === 'update'
          ? DistributionPointsMessagesHelper.ONLY_OWNER_OR_ADMIN_CAN_UPDATE
          : DistributionPointsMessagesHelper.ONLY_OWNER_OR_ADMIN_CAN_DELETE;

      throw new ForbiddenException(message);
    }
  }

  async create(
    body: CreateDistributionPointDto,
    security?: ISecurity,
  ): Promise<DistributionPoint> {
    const { roles, userId } = security || {};
    const isAdmin = roles?.includes(EAuthRoles.ADMIN);

    const ownerId = isAdmin && body.userId ? body.userId : userId;

    if (!ownerId) {
      throw new ForbiddenException(
        DistributionPointsMessagesHelper.INVALID_USER_FOR_CREATION,
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

    const addressPayload = { ...body.address };

    if (!addressPayload.latitude || !addressPayload.longitude) {
      const coords = await getCoordinates(addressPayload);
      if (coords) {
        addressPayload.latitude = coords.latitude;
        addressPayload.longitude = coords.longitude;
      }
    }

    const transactionResult = await this.dataSource.transaction(
      async (transactionManager) => {
        const distributionPointRepository =
          transactionManager.getRepository(DistributionPoint);
        const pointRequestedProductRepository =
          transactionManager.getRepository(PointRequestedProduct);
        const productsRepository = transactionManager.getRepository(Product);
        const addressRepository = transactionManager.getRepository(Address);

        const savedAddress = await addressRepository.save(
          addressRepository.create({
            cep: addressPayload.cep,
            estado: addressPayload.estado,
            pais: addressPayload.pais,
            municipio: addressPayload.municipio,
            bairro: addressPayload.bairro,
            logradouro: addressPayload.logradouro,
            numero: addressPayload.numero,
            complemento: addressPayload.complemento ?? null,
            latitude: addressPayload.latitude ?? null,
            longitude: addressPayload.longitude ?? null,
          }),
        );

        const distributionPoint = distributionPointRepository.create({
          title: body.title,
          description: body.description ?? null,
          phone: body.phone,
          ownerId,
          status: DistributionPointStatus.PENDING,
          address: savedAddress,
        });

        const savedDistributionPoint =
          await distributionPointRepository.save(distributionPoint);

        const toSave: PointRequestedProduct[] = [];

        for (const item of requestedProducts) {
          const slug = this.productsService.normalizeSlug(
            item.slug || item.name,
          );

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

          const computedStatus = this.requestedProductService.computeStatus(
            item.requestedQuantity,
            0,
          );

          const entity = pointRequestedProductRepository.create({
            point: { id: savedDistributionPoint.id },
            product: { id: product.id },
            requestedQuantity: item.requestedQuantity,
            donatedQuantity: 0,
            status: computedStatus,
            closesAt:
              computedStatus === RequestedProductStatus.FULL
                ? new Date()
                : null,
          });

          toSave.push(entity);
        }

        await pointRequestedProductRepository.save(toSave);

        const fullPoint = await distributionPointRepository.findOne({
          where: { id: savedDistributionPoint.id },
          relations: {
            address: true,
            files: true,
          },
        });

        if (!fullPoint) {
          throw new NotFoundException(
            DistributionPointsMessagesHelper.POINT_NOT_FOUND_AFTER_CREATION,
          );
        }

        return fullPoint;
      },
    );

    if (transactionResult) {
      const bairro = transactionResult.address?.bairro || 'sua região';
      const cidade = transactionResult.address?.municipio || 'Cidade';

      const notificationTitle = `Novo Ponto em ${bairro}!`;
      const notificationMessage = `${transactionResult.title} acabou de abrir em ${cidade}. Toque para ver como ajudar.`;

      await this.notificationService
        .notifyAllUsers({
          type: NotificationType.DISTRIBUTION,
          title: notificationTitle,
          message: notificationMessage,
          severity: NotificationSeverity.INFO,
        })
        .catch((err) => console.error('Erro ao notificar em background', err));
    }

    return transactionResult;
  }

  async list(query: ListDistributionPointsDto) {
    const pagination = buildPagination(query, { createdAt: 'DESC' });

    const queryBuilder = this.repository
      .createQueryBuilder('distributionPoint')
      .leftJoinAndSelect('distributionPoint.address', 'address')
      .leftJoin('distributionPoint.requestedProducts', 'requestedProduct')
      .leftJoin('requestedProduct.product', 'product')
      .take(pagination.take)
      .skip(pagination.skip);

    if (query.ownerId) {
      queryBuilder.andWhere('distributionPoint.ownerId = :ownerId', {
        ownerId: query.ownerId,
      });
    }

    if (query.q?.trim()) {
      const q = query.q.trim();
      queryBuilder.andWhere(
        '(distributionPoint.title ILIKE :q OR distributionPoint.description ILIKE :q OR distributionPoint.phone ILIKE :q OR address.municipio ILIKE :q OR address.bairro ILIKE :q OR address.logradouro ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    const allowedSortBy = new Set([
      'createdAt',
      'updatedAt',
      'title',
      'status',
      'municipio',
      'estado',
    ]);

    const sortField = Object.keys(pagination.order)[0];
    const sortDir = pagination.order[sortField];
    const sortBy = allowedSortBy.has(sortField) ? sortField : 'createdAt';

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
      page: pagination.page,
      limit: pagination.limit,
      pages: Math.ceil(total / pagination.limit),
    };
  }

  async findById(
    distributionPointId: string,
    relations?: FindOptionsRelations<DistributionPoint>,
  ): Promise<DistributionPoint> {
    const point = await this.repository.findOne({
      where: { id: distributionPointId },
      relations,
    });

    if (!point) {
      throw new NotFoundException(
        DistributionPointsMessagesHelper.POINT_NOT_FOUND,
      );
    }

    return point;
  }

  async update(
    distributionPointId: string,
    body: UpdateDistributionPointDto,
    options?: ISecurity,
  ): Promise<DistributionPoint> {
    const distributionPoint = await this.findById(distributionPointId, {
      address: true,
    });

    this.validateSecurity(distributionPoint, 'update', options);

    const oldTitle = distributionPoint.title;
    let addressChanged = false;

    if (body.title !== undefined) distributionPoint.title = body.title;
    if (body.description !== undefined)
      distributionPoint.description = body.description ?? null;
    if (body.phone !== undefined) distributionPoint.phone = body.phone;

    if (body.address) {
      if (!distributionPoint.address) {
        distributionPoint.address = new Address();
      }

      const addrBody = body.address;
      const addrEntity = distributionPoint.address;

      if (addrBody.cep !== undefined) addrEntity.cep = addrBody.cep;
      if (addrBody.estado !== undefined) addrEntity.estado = addrBody.estado;
      if (addrBody.pais !== undefined) addrEntity.pais = addrBody.pais;
      if (addrBody.municipio !== undefined)
        addrEntity.municipio = addrBody.municipio;
      if (addrBody.bairro !== undefined) addrEntity.bairro = addrBody.bairro;
      if (addrBody.logradouro !== undefined)
        addrEntity.logradouro = addrBody.logradouro;
      if (addrBody.numero !== undefined) addrEntity.numero = addrBody.numero;
      if (addrBody.complemento !== undefined)
        addrEntity.complemento = addrBody.complemento ?? null;
      if (addrBody.latitude !== undefined)
        addrEntity.latitude = addrBody.latitude ?? null;
      if (addrBody.longitude !== undefined)
        addrEntity.longitude = addrBody.longitude ?? null;

      addressChanged = true;

      if (addrBody.latitude === undefined && addrBody.longitude === undefined) {
        const coords = await getCoordinates(addrEntity);
        if (coords) {
          addrEntity.latitude = coords.latitude;
          addrEntity.longitude = coords.longitude;
        }
      }
    }

    const transactionResult = await this.dataSource.transaction(
      async (transactionManager) => {
        const distributionPointRepository =
          transactionManager.getRepository(DistributionPoint);
        const addressRepository = transactionManager.getRepository(Address);

        if (distributionPoint.address) {
          await addressRepository.save(distributionPoint.address);
        }

        await distributionPointRepository.save(distributionPoint);

        const fullPoint = await distributionPointRepository.findOne({
          where: { id: distributionPoint.id },
          relations: {
            address: true,
            files: true,
          },
        });

        if (!fullPoint)
          throw new NotFoundException(
            DistributionPointsMessagesHelper.POINT_NOT_FOUND,
          );
        return fullPoint;
      },
    );

    if (transactionResult) {
      let title = 'Novidades no Ponto!';
      let message = `O ponto ${transactionResult.title} atualizou suas informações.`;

      if (addressChanged) {
        title = 'Mudamos de Endereço!';
        message = `O ponto ${transactionResult.title} está agora em ${transactionResult.address?.bairro || 'novo local'}. Confira!`;
      } else if (oldTitle !== transactionResult.title) {
        message = `O ponto agora se chama ${transactionResult.title}.`;
      }

      await this.notificationService
        .notifyAllUsers({
          type: NotificationType.DISTRIBUTION,
          title: title,
          message: message,
          severity: NotificationSeverity.INFO,
        })
        .catch((err) => console.error('Erro ao notificar em background', err));
    }

    return transactionResult;
  }

  async remove(
    distributionPointId: string,
    options?: ISecurity,
  ): Promise<{ ok: true }> {
    const distributionPoint = await this.findById(distributionPointId);

    this.validateSecurity(distributionPoint, 'delete', options);

    await this.repository.delete({ id: distributionPointId });

    await this.notificationService
      .notifyAllUsers({
        type: NotificationType.DISTRIBUTION,
        title: 'Ponto Encerrado',
        message: `O ponto de distribuição "${distributionPoint.title}" encerrou suas atividades.`,
        severity: NotificationSeverity.WARNING,
      })
      .catch((err) => console.error('Erro ao notificar em background', err));

    return { ok: true };
  }
}
