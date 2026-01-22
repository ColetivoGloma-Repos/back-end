import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseBoolPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Product } from './entities/product.entity';
import { CreateProductDto, ListProductsDto, UpdateProductDto } from './dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: CreateProductDto): Promise<Product> {
    return this.productsService.create(body);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async list(@Query() query: ListProductsDto) {
    return this.productsService.list(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async findById(@Param('id') id: string): Promise<Product> {
    return this.productsService.findById(id);
  }

  @Get('slug/:slug')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async findBySlug(@Param('slug') slug: string): Promise<Product> {
    return this.productsService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, body);
  }

  @Patch(':id/active')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async setActive(
    @Param('id') id: string,
    @Query('value', ParseBoolPipe) value: boolean,
  ): Promise<Product> {
    return this.productsService.setActive(id, value);
  }
}
