import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DistribuitionPointsService } from './distribuition-point.service';
import { CreateDistribuitionPoin, UpdateDistribuitionPoin } from './dto';
import { ProductDto } from './dto/product.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateUserDto } from '../auth/dto/auth.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SearchDistribuitionPoin } from './dto/search-distribuition-point';
import { ProductStatus } from '../products/enums/product.status';
import { ChangeStatusDto } from './dto/change-status.dto';

@ApiTags('Distribution points')
@Controller('distribuitionPoint')
export class DistribuitionPointsController {
  constructor(private distribuitionPointService: DistribuitionPointsService) { }

  @Post('/')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('coordinator', 'user')
  async create(
    @CurrentUser() currentUser: CreateUserDto,
    @Body() createDistribuitionPoint: CreateDistribuitionPoin,
  ) {
    return await this.distribuitionPointService.create(
      createDistribuitionPoint,
      currentUser,
    );
  }

  @Patch('/:distribuitionPointId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('coordinator', 'user')
  async update(
    @Param('distribuitionPointId') distribuitionPointId: string,
    @Body() updateDistribuitionPoin: UpdateDistribuitionPoin,
  ) {
    return await this.distribuitionPointService.update(
      updateDistribuitionPoin,
      distribuitionPointId,
    );
  }

  @Get('/')
  async listAll(@Query() query: SearchDistribuitionPoin) {
    return await this.distribuitionPointService.listAll(query);
  }

  @Get('/:distribuitionPointId')
  async findOne(@Param('distribuitionPointId') distribuitionPointId: string) {
    return await this.distribuitionPointService.findOne(distribuitionPointId, {
      address: true,
      creator: true,
    });
  }

  @Delete('/:distribuitionPointId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('coordinator', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('distribuitionPointId') distribuitionPointId: string) {
    return await this.distribuitionPointService.remove(distribuitionPointId);
  }

  @Patch('/:distribuitionPointId/products')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('coordinator', 'user')
  async addOrRemoveProduct(
    @CurrentUser() currentUser: CreateUserDto,
    @Param('distribuitionPointId') distribuitionPointId: string,
    @Body() distribuitionPointAction: ProductDto,
  ) {
    const { action, productId } = distribuitionPointAction;
    if (action === 'add') {
      return await this.distribuitionPointService.addProduct(
        distribuitionPointId,
        productId,
        currentUser,
      );
    }
    if (action === 'remove') {
      return await this.distribuitionPointService.removeProduct(
        distribuitionPointId,
        productId,
        currentUser,
      );
    }
  }

  @Get('/:distribuitionPointId/statistic/:status')
  async statisticsReceived(
    @Param('distribuitionPointId') distribuitionPointId: string,

  ) {
    const result = await this.distribuitionPointService.statistics(
      distribuitionPointId,
      ProductStatus.RECEIVED
    );
    return result;
  }

  @Get('/:distribuitionPointId/statistic-requested')
  async statisticsRequested(@Param('distribuitionPointId') distribuitionPointId: string) {
    const result = await this.distribuitionPointService.statistics(
      distribuitionPointId,
      ProductStatus.REQUESTED
    );
    return result;
  }

  @Patch('/:distribuitionPointId/change-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('coordinator', 'user')
  @ApiBearerAuth()
  async changeStatus(
    @CurrentUser() currentUser: CreateUserDto,
    @Param('distribuitionPointId') distribuitionPointId: string,
    @Body() status: ChangeStatusDto,
  ) {
    return await this.distribuitionPointService.changeStatus(
      distribuitionPointId,
      status.status,
      currentUser
    )
  }

}




