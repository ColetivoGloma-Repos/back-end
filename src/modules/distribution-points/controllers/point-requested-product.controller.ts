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

@ApiTags('PointRequestedProducts')
@Controller('point-requested-products')
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
  @UseGuards(AuthGuard('jwt'))
  async list(@Query() query: ListPointRequestedProductsDto) {
    return this.pointRequestedProductsService.list(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async findById(@Param('id') id: string): Promise<PointRequestedProduct> {
    return this.pointRequestedProductsService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() body: UpdatePointRequestedProductDto,
  ): Promise<PointRequestedProduct> {
    return this.pointRequestedProductsService.update(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string): Promise<{ ok: true }> {
    return this.pointRequestedProductsService.remove(id);
  }
}
