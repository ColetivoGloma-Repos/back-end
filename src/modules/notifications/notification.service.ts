import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { User } from '../auth/entities/auth.enity';
import { paginate } from 'src/utils/paginate-result.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create(createNotificationDto);
    await this.notificationRepository.save(notification);
    return notification;
  }

  async notifyAllUsers(createNotificationDto: CreateNotificationDto) {
    const allUsers = await this.usersRepository.find();
    const notifications: Notification[] = [];

    for (const user of allUsers) {
      const notificationData = { ...createNotificationDto, userId: user.id };
      const notification = this.notificationRepository.create(notificationData);
      await this.notificationRepository.save(notification);
      notifications.push(notification);
    }

    return notifications;
  }

  async update(createNotificationDto: CreateNotificationDto, notificationId: string) {
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
}