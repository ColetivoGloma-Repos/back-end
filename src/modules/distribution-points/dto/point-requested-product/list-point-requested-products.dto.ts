import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { QueryRequest } from 'src/common/dto/query';
import { RequestedProductStatus } from '../../shared';
import { CommonMessagesHelper } from 'src/common/helpers';
import { ToBoolean } from 'src/common/validation';

export class ListPointRequestedProductsDto extends QueryRequest {
  @ApiPropertyOptional({
    example: '9f3a1e2c-3b4c-5d6e-7f80-1234567890ab',
    format: 'uuid',
    description: 'ID do ponto',
  })
  @IsOptional()
  @IsUUID('4', {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE(
      'distributionPointId',
      'uuid',
    ),
  })
  distributionPointId?: string;

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
    example: true,
    description: 'Quando true, retorna apenas OPEN e FULL',
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('activeOnly', 'boolean'),
  })
  activeOnly?: boolean;
}
