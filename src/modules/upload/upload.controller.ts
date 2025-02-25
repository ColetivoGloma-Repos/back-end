import { Controller, Post, Get, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './upload.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const savedFile = await this.filesService.uploadFile(file);
    return { id: savedFile.id, url: savedFile.url };
  }

  @Get()
  async getFiles() {
    return this.filesService.getFiles();
  }
}
