import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { QueryRequest } from 'src/common/dto/query';
import { DonationStatus } from '../../shared';

export class ListDonationsDto extends QueryRequest {
  @ApiPropertyOptional({ example: '9f3a1e2c-3b4c-5d6e-7f80-1234567890ab' })
  @IsOptional()
  @IsUUID()
  pointId?: string;

  @ApiPropertyOptional({ example: 'b2a3c4d5-e6f7-4890-8123-4567890abcde' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-4901-9234-567890abcdef' })
  @IsOptional()
  @IsUUID()
  requestedProductId?: string;

  @ApiPropertyOptional({ enum: DonationStatus, example: DonationStatus.ACTIVE })
  @IsOptional()
  @IsEnum(DonationStatus)
  status?: DonationStatus;

  @ApiPropertyOptional({ example: 'arroz' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  q?: string;
}
