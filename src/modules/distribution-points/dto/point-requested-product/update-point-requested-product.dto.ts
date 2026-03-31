import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { RequestedProductStatus } from '../../shared';
import { CommonMessagesHelper } from 'src/common/helpers';
import { Trim } from 'src/common/validation';

export class UpdatePointRequestedProductDto {
  @ApiPropertyOptional({
    example: 100,
    minimum: 1,
    description: 'Quantidade solicitada (mínimo 1)',
  })
  @IsOptional()
  @IsInt({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE(
      'requestedQuantity',
      'integer',
    ),
  })
  @Min(1, { message: CommonMessagesHelper.NUMBER_MIN('requestedQuantity', 1) })
  requestedQuantity?: number;

  @ApiPropertyOptional({ example: 'Arroz' })
  @IsOptional()
  @Trim()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('productName', 'string'),
  })
  @MaxLength(200, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('productName', 200),
  })
  productName?: string;

  @ApiPropertyOptional({
    enum: RequestedProductStatus,
    example: RequestedProductStatus.OPEN,
    description: 'Status do produto solicitado',
  })
  @IsOptional()
  @IsEnum(RequestedProductStatus, {
    message: CommonMessagesHelper.FIELD_INVALID_ENUM('status'),
  })
  status?: RequestedProductStatus;

  @ApiPropertyOptional({
    example: '2026-01-21T12:00:00.000Z',
    nullable: true,
    description: 'Data/hora de fechamento (ISO 8601) ou null para limpar',
  })
  @IsOptional()
  closesAt?: string | null;
}
