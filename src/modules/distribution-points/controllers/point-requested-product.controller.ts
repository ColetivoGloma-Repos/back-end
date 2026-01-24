import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PointRequestedProductsService } from '../services/point-requested-product.service';
import { PointRequestedProduct } from '../entities/point-requested-product.entity';
import {
  CreatePointRequestedProductDto,
  ListPointRequestedProductsDto,
  UpdatePointRequestedProductDto,
} from '../dto/point-requested-product';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { CreateUserDto } from 'src/modules/auth/dto/auth.dto';

@ApiTags('DistributionPointRequestedProducts')
@Controller('distribution-point/requested-products')
export class PointRequestedProductsController {
  constructor(
    private readonly pointRequestedProductsService: PointRequestedProductsService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Body() body: CreatePointRequestedProductDto,
  ): Promise<PointRequestedProduct[]> {
    return this.pointRequestedProductsService.create(body);
  }

  @Get()
  @ApiBearerAuth()
  async list(@Query() query: ListPointRequestedProductsDto) {
    return this.pointRequestedProductsService.list(query);
  }

  @Get(':requestedProductId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async findById(
    @Param('requestedProductId') requestedProductId: string,
  ): Promise<PointRequestedProduct> {
    return this.pointRequestedProductsService.findById(requestedProductId);
  }

  @Patch(':requestedProductId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('requestedProductId') requestedProductId: string,
    @Body() body: UpdatePointRequestedProductDto,
  ): Promise<PointRequestedProduct> {
    return this.pointRequestedProductsService.update(requestedProductId, body);
  }

  @Delete(':requestedProductId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(
    @Param('requestedProductId') requestedProductId: string,
  ): Promise<{ ok: true }> {
    return this.pointRequestedProductsService.remove(requestedProductId);
  }

  @Delete(':requestedProductId/donations')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async cancelAll(
    @CurrentUser() currentUser: CreateUserDto,
    @Param('requestedProductId') requestedProductId: string,
  ): Promise<{ ok: true }> {
    return this.pointRequestedProductsService.cancelAllDonationsForUser(
      currentUser.id,
      requestedProductId,
    );
  }

  @Patch(':requestedProductId/confirm-delivered')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async confirmDeliveryAllDonations(
    @Param('requestedProductId') requestedProductId: string,
  ): Promise<{ ok: true }> {
    return this.pointRequestedProductsService.confirmDeliveryAllDonations(
      requestedProductId,
    );
  }
}
