import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { QueryRequest } from 'src/common/dto/query';
import { DonationStatus } from '../../shared';
import { CommonMessagesHelper } from 'src/common/helpers/common-messages.helper';

export class ListDonationsDto extends QueryRequest {
  @ApiPropertyOptional({
    example: '9f3a1e2c-3b4c-5d6e-7f80-1234567890ab',
    format: 'uuid',
    description: 'Filtro por ponto',
  })
  @IsOptional()
  @IsUUID('4', {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('pointId', 'uuid'),
  })
  pointId?: string;

  @ApiPropertyOptional({
    example: 'b2a3c4d5-e6f7-4890-8123-4567890abcde',
    format: 'uuid',
    description: 'Filtro por usuário',
  })
  @IsOptional()
  @IsUUID('4', {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('userId', 'uuid'),
  })
  userId?: string;

  @ApiPropertyOptional({
    example: 'c3d4e5f6-a7b8-4901-9234-567890abcdef',
    format: 'uuid',
    description: 'Filtro por produto solicitado',
  })
  @IsOptional()
  @IsUUID('4', {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE(
      'requestedProductId',
      'uuid',
    ),
  })
  requestedProductId?: string;

  @ApiPropertyOptional({
    enum: DonationStatus,
    example: DonationStatus.ACTIVE,
    description: 'Filtro por status da doação',
  })
  @IsOptional()
  @IsEnum(DonationStatus, {
    message: CommonMessagesHelper.FIELD_INVALID_ENUM('status'),
  })
  status?: DonationStatus;
}
