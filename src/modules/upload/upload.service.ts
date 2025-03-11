import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class UploadService {
  private s3: S3Client;
  private bucket: string;

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {
    this.s3 = new S3Client({
      region: process.env.SPACES_REGION,
      endpoint: process.env.SPACES_ENDPOINT,
      credentials: {
        accessKeyId: process.env.SPACES_ACCESS_KEY,
        secretAccessKey: process.env.SPACES_SECRET_KEY,
      },
    });

    this.bucket = process.env.SPACES_BUCKET;
  }

  async uploadFile(file: Express.Multer.File, itemType: string, itemId: string): Promise<FileEntity> {
    const fileKey = `uploads/${uuidv4()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    });

    await this.s3.send(command);

    const fileUrl = `${process.env.SPACES_ENDPOINT}/${this.bucket}/${fileKey}`;

    const newFile = this.fileRepository.create({
      filename: file.originalname,
      url: fileUrl,
      ref: file.filename,
      type: file.mimetype,
      itemType: itemType,
      itemId: itemId, // Vincular ao ID do item
    });

    return this.fileRepository.save(newFile);
  }

  async getFiles(): Promise<FileEntity[]> {
    return this.fileRepository.find();
  }
}