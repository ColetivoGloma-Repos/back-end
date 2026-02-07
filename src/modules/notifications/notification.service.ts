import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Not, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { User } from '../auth/entities/auth.enity';
import { paginate } from 'src/utils/paginate-result.service';

interface NotifyAllOptions {
  excludeIds?: string[];
}

const CHUNK_SIZE = 1000;

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create(
      createNotificationDto,
    );
    await this.notificationRepository.save(notification);
    return notification;
  }

  async notifyAllUsers(
    createNotificationDto?: CreateNotificationDto,
    options?: NotifyAllOptions,
  ): Promise<{ count: number }> {
    if (!createNotificationDto) {
      return { count: 0 };
    }

    let whereCondition: FindOptionsWhere<User> = {};

    if (options?.excludeIds?.length) {
      const uniqueExcludedIds = [...new Set(options.excludeIds)];
      whereCondition = {
        id: Not(In(uniqueExcludedIds)),
      };
    }

    const users = await this.usersRepository.find({
      select: ['id'],
      where: whereCondition,
    });

    if (!users.length) return { count: 0 };

    for (let i = 0; i < users.length; i += CHUNK_SIZE) {
      const usersChunk = users.slice(i, i + CHUNK_SIZE);

      const notificationsToInsert = usersChunk.map((user) => ({
        ...createNotificationDto,
        userId: user.id,
      }));

      await this.notificationRepository
        .createQueryBuilder()
        .insert()
        .into(Notification)
        .values(notificationsToInsert)
        .execute();
    }

    return { count: users.length };
  }

  async update(
    createNotificationDto: CreateNotificationDto,
    notificationId: string,
  ) {
    const notification = await this.findOne(notificationId);
    Object.assign(notification, createNotificationDto);
    await this.notificationRepository.save(notification);
    return notification;
  }

  async findOne(notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }
    return notification;
  }

  async listAll(): Promise<Notification[]> {
    return await this.notificationRepository.find();
  }

  async remove(notificationId: string) {
    const notification = await this.findOne(notificationId);
    await this.notificationRepository.remove(notification);
    return { message: 'Notificação removida com sucesso' };
  }

  async getUserNotificationsPaginated(userId: string, page = 1, limit = 10) {
    return await paginate(this.notificationRepository, {
      where: { userId },
      order: { createdAt: 'DESC' },
      page,
      limit,
    });
  }

  async notifyMany(
    userIds: string[],
    payload: Omit<CreateNotificationDto, 'userId'>,
  ) {
    const uniqueUserIds = [...new Set(userIds)];
    if (!uniqueUserIds.length) return;

    const rawData = uniqueUserIds.map((userId) => ({
      userId,
      ...payload,
    }));

    for (let i = 0; i < rawData.length; i += CHUNK_SIZE) {
      const chunk = rawData.slice(i, i + CHUNK_SIZE);

      await this.notificationRepository
        .createQueryBuilder()
        .insert()
        .into(Notification)
        .values(chunk)
        .execute();
    }
  }
}
