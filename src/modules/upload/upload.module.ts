import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { FileUploadEntity } from './entities/file.entity';
import { AuthModule } from '../auth/auth.module';
import { DistributionPointModule } from '../distribution-points/distribution-point.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileUploadEntity]),
    MulterModule.register({
      dest: './uploads',
    }),
    forwardRef(() => AuthModule),
    DistributionPointModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [TypeOrmModule, UploadService],
})
export class UploadModule {}
