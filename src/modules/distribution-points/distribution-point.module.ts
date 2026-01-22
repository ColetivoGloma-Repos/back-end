import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { NotificationModule } from '../notifications/notification.module';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DistributionPoint,
      PointRequestedProduct,
      Donation,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => ProductsModule),
    NotificationModule,
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
