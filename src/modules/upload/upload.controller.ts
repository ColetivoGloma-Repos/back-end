import { Controller, Post, Get, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('files')
export class UploadController {
  constructor(private readonly filesService: UploadService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
    @Body('distributionPointId') distributionPointId?: string,
  ) {
    const savedFile = await this.filesService.uploadFile(file, userId, distributionPointId);
    return { id: savedFile.id, url: savedFile.url };
  }

  @Get()
  async getFiles() {
    return this.filesService.getFiles();
  }
}