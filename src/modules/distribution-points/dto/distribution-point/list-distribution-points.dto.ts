import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { QueryRequest } from 'src/common/dto/query';
import { CommonMessagesHelper } from 'src/common/helpers/common-messages.helper';
import { ToBoolean, TrimToUndefined } from 'src/common/validation';

export class ListDistributionPointsDto extends QueryRequest {
  @ApiPropertyOptional({
    example: '9f3a1e2c-3b4c-5d6e-7f80-1234567890ab',
    format: 'uuid',
    description: 'ID do proprietário',
  })
  @IsOptional()
  @IsUUID('4', {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('ownerId', 'uuid'),
  })
  ownerId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filtro por ativo (true/false)',
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('active', 'boolean'),
  })
  active?: boolean;

  @ApiPropertyOptional({
    example: 'Salvador',
    maxLength: 120,
    description: 'Filtro por cidade',
  })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('city', 'string'),
  })
  @MaxLength(120, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('city', 120),
  })
  city?: string;

  @ApiPropertyOptional({
    example: 'BA',
    maxLength: 2,
    description: 'Filtro por UF (2 letras)',
  })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('state', 'string'),
  })
  @MaxLength(2, { message: CommonMessagesHelper.FIELD_MAX_LENGTH('state', 2) })
  state?: string;
}
