import { Module, forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DistribuitionPointsModule } from '../distriuition-points/distribuition-point.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    forwardRef(() => DistribuitionPointsModule),
    forwardRef(() => AuthModule),
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [TypeOrmModule, ProductsService],
})
export class ProductsModule {}
