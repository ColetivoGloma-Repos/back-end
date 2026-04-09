import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileUploadEntity } from './entities/file.entity';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import { User } from 'src/modules/auth/entities/auth.enity';
import { Readable } from 'stream';
import { DistributionPointService } from '../distribution-points/services';
import { DistributionPoint } from '../distribution-points/entities';

dotenv.config();

@Injectable()
export class UploadService {
  private s3: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor(
    @InjectRepository(FileUploadEntity)
    private readonly fileRepository: Repository<FileUploadEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly distributionPointService: DistributionPointService,
  ) {
    const spacesRegion = process.env.SPACES_REGION?.trim();
    const spacesEndpoint =
      process.env.SPACES_ENDPOINT?.trim() ||
      (spacesRegion ? `https://${spacesRegion}.digitaloceanspaces.com` : '');
    const accessKeyId =
      process.env.SPACES_ACCESS_KEY?.trim() ||
      process.env.ACCESSKEYID?.trim() ||
      '';
    const secretAccessKey =
      process.env.SPACES_SECRET_KEY?.trim() ||
      process.env.SECRETACCESSKEY?.trim() ||
      process.env.SECRETCCESSKEY?.trim() ||
      '';
    const bucket =
      process.env.SPACES_BUCKET?.trim() || process.env.BUCKET?.trim() || '';
    const region =
      spacesRegion || process.env.REGION?.trim() || 'us-east-1';

    if (!spacesEndpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        'S3/Spaces configuration is invalid. Set SPACES_ENDPOINT, SPACES_ACCESS_KEY, SPACES_SECRET_KEY, and SPACES_BUCKET.',
      );
    }

    this.s3 = new S3Client({
      region,
      endpoint: spacesEndpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucket = bucket;
    this.endpoint = spacesEndpoint;
  }

  async uploadFile(
    file: Express.Multer.File,
    itemType: string,
    itemId: string,
  ): Promise<FileUploadEntity> {
    let item: User | DistributionPoint;
    if (itemType === 'user') {
      item = await this.userRepository.findOneBy({ id: itemId });
      if (!item) {
        throw new Error('User not found');
      }
    } else if (itemType === 'distributionPoint') {
      item = await this.distributionPointService.findById(itemId);
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

    const fileUrl = `${this.endpoint}/${this.bucket}/${fileKey}`;

    const relationPayload: Partial<FileUploadEntity> = {};
    if (itemType === 'user') {
      relationPayload.user = item as User;
    } else if (itemType === 'distributionPoint') {
      relationPayload.distribuitionPoint = item as DistributionPoint;
    }

    const newFile = this.fileRepository.create({
      filename: file.originalname,
      url: fileUrl,
      ref: fileKey,
      type: file.mimetype,
      ...relationPayload,
    });

    return this.fileRepository.save(newFile);
  }

  async getFiles(): Promise<FileUploadEntity[]> {
    return this.fileRepository.find();
  }
}
