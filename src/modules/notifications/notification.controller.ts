import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('/')
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return await this.notificationService.create(createNotificationDto);
  }

  @Patch('/:notificationId')
  async update(
    @Param('notificationId') notificationId: string,
    @Body() updateNotificationDto: CreateNotificationDto,
  ) {
    return await this.notificationService.update(updateNotificationDto, notificationId);
  }

  @Get('/')
  async listAll() {
    return await this.notificationService.listAll();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('/me')
  async getMyNotifications(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const userId = req.user.id;
    return await this.notificationService.getUserNotificationsPaginated(userId, page, limit);
  }

  @Delete('/:notificationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('notificationId') notificationId: string) {
    return await this.notificationService.remove(notificationId);
  }
}