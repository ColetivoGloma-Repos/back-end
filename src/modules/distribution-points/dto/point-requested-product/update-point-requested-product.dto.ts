import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { RequestedProductStatus } from '../../shared';
import { CommonMessagesHelper } from 'src/common/helpers';

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

  @ApiPropertyOptional({
    example: '2a1b3c4d-5e6f-7081-92a3-b4c5d6e7f890',
    format: 'uuid',
    description: 'ID do produto',
  })
  @IsOptional()
  @IsUUID('4', {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('productId', 'uuid'),
  })
  productId?: string;

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
