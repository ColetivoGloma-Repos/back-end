import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { DistributionPoint, PointRequestedProduct, Donation } from './entities';
import {
  DistributionPointController,
  PointRequestedProductsController,
  DonationController,
} from './controllers';
import {
  DistributionPointService,
  PointRequestedProductsService,
  DonationsService,
} from './services';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DistributionPoint,
      PointRequestedProduct,
      Donation,
    ]),
    NotificationModule,
    ProductsModule,
  ],
  providers: [
    DistributionPointService,
    PointRequestedProductsService,
    DonationsService,
  ],
  controllers: [
    DistributionPointController,
    PointRequestedProductsController,
    DonationController,
  ],
  exports: [
    TypeOrmModule,
    DistributionPointService,
    PointRequestedProductsService,
    DonationsService,
  ],
})
export class DistributionPointModule {}
