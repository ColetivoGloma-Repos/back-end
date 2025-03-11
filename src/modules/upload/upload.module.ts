import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { FileUploadEntity } from './entities/file.entity';
import { AuthModule } from '../auth/auth.module';
import { DistribuitionPointsModule } from '../distriuition-points/distribuition-point.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileUploadEntity]),
    MulterModule.register({
      dest: './uploads',
    }),
    forwardRef(() => AuthModule),
    forwardRef(() => DistribuitionPointsModule),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [TypeOrmModule, UploadService],
})
export class UploadModule {}