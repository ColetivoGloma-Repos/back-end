import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from 'src/modules/auth/dto/adress.dto';
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
