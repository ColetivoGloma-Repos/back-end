import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileUploadEntity } from './entities/file.entity';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import { User } from 'src/modules/auth/entities/auth.enity';
import { DistribuitionPoints } from 'src/modules/distriuition-points/entities/distribuition-point.entity';
import { Readable } from 'stream';

dotenv.config();

@Injectable()
export class UploadService {
  private s3: S3Client;
  private bucket: string;

  constructor(
    @InjectRepository(FileUploadEntity)
    private readonly fileRepository: Repository<FileUploadEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DistribuitionPoints)
    private readonly distribuitionPointsRepository: Repository<DistribuitionPoints>,
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

  async uploadFile(file: Express.Multer.File, itemType: string, itemId: string): Promise<FileUploadEntity> {
    let item;
    if (itemType === 'user') {
      item = await this.userRepository.findOneBy({ id: itemId });
      if (!item) {
        throw new Error('User not found');
      }
    } else if (itemType === 'distribuitionPoint') {
      item = await this.distribuitionPointsRepository.findOneBy({ id: itemId });
      if (!item) {
        throw new Error('Distribuition Point not found');
      }
    } else {
      throw new Error('Invalid item type');
    }

    const fileKey = `uploads/${uuidv4()}-${file.originalname}`;

    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);

    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucket,
        Key: fileKey,
        Body: stream,
        ACL: 'public-read',
        ContentType: file.mimetype,
      },
    });

    await upload.done();

    const fileUrl = `${process.env.SPACES_ENDPOINT}/${this.bucket}/${fileKey}`;

    const newFile = this.fileRepository.create({
      filename: file.originalname,
      url: fileUrl,
      ref: fileKey,
      type: file.mimetype,
      [itemType]: item, 
    });

    return this.fileRepository.save(newFile);
  }

  async getFiles(): Promise<FileUploadEntity[]> {
    return this.fileRepository.find();
  }
}