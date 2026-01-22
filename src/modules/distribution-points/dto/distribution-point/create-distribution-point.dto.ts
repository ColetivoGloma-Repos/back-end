import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from 'src/modules/auth/dto/adress.dto';
import { DistributionPointStatus } from '../../shared';
import { CommonMessagesHelper } from 'src/common/helpers';
import { TrimToUndefined } from 'src/common/validation';
import { CreateRequestedProductDto } from '../point-requested-product';

export class CreateDistributionPointDto {
  @ApiProperty({ example: 'Ponto Central' })
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('title', 'string'),
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('title') })
  @MaxLength(180, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('title', 180),
  })
  title!: string;

  @ApiPropertyOptional({ example: 'Ponto para arrecadação', nullable: true })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('description', 'string'),
  })
  @MaxLength(2000, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('description', 2000),
  })
  description?: string | null;

  @ApiProperty({ example: '+55 71 99999-9999' })
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('phone', 'string'),
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('phone') })
  @MaxLength(40, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('phone', 40),
  })
  phone!: string;

  @ApiProperty({
    example: '9f3a1e2c-3b4c-5d6e-7f80-1234567890ab',
    format: 'uuid',
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('ownerId') })
  @IsUUID('4', {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('ownerId', 'uuid'),
  })
  ownerId!: string;

  @ApiPropertyOptional({
    enum: DistributionPointStatus,
    example: DistributionPointStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(DistributionPointStatus, {
    message: CommonMessagesHelper.FIELD_INVALID_ENUM('status'),
  })
  status?: DistributionPointStatus;

  @ApiProperty({ type: CreateAddressDto })
  @ValidateNested({ message: CommonMessagesHelper.FIELD_INVALID('address') })
  @Type(() => CreateAddressDto)
  address!: CreateAddressDto;

  @ApiProperty({
    type: [CreateRequestedProductDto],
    example: [
      {
        productId: '2a1b3c4d-5e6f-7081-92a3-b4c5d6e7f890',
        requestedQuantity: 100,
      },
    ],
  })
  @IsArray({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE(
      'requestedProducts',
      'array',
    ),
  })
  @ValidateNested({ each: true })
  @Type(() => CreateRequestedProductDto)
  requestedProducts!: CreateRequestedProductDto[];
}
