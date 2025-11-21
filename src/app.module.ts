import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { dataSourceConfig } from './database/dataSource';
import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NeedModule } from './modules/need/need.module';
import { ShelterModule } from './modules/shelter/shelter.module';
import { CompanyModule } from './modules/company/company.module';
import { DistribuitionPointsModule } from './modules/distriuition-points/distribuition-point.module';
import { ProductsModule } from './modules/products/product.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SearchModule } from './modules/search/search.module';
import { ManagementModule } from './modules/management/management.module';
import { UploadModule } from './modules/upload/upload.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceConfig() as TypeOrmModuleOptions),
    AuthModule,
    MailModule,
    CompanyModule,
    NeedModule,
    ShelterModule,
    NotificationModule,
    DashboardModule,
    DistribuitionPointsModule,
    ProductsModule,
    SearchModule,
    UploadModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src', 'assets'),
      serveRoot: '/assets',
    }),
    SearchModule,
    ManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [TypeOrmModule],
})
export class AppModule {}
