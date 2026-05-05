import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UpdateAddressDto } from 'src/modules/auth/dto/update-adress.dto';
import { DistributionPointStatus } from '../../shared';
import { CommonMessagesHelper } from 'src/common/helpers';
import { TrimToUndefined } from 'src/common/validation';

export class UpdateDistributionPointDto {
  @ApiPropertyOptional({ example: 'Ponto Central Atualizado' })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('title', 'string'),
  })
  @MaxLength(180, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('title', 180),
  })
  title?: string;

  @ApiPropertyOptional({ example: 'Descrição atualizada', nullable: true })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('description', 'string'),
  })
  @MaxLength(2000, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('description', 2000),
  })
  description?: string | null;

  @ApiPropertyOptional({ example: '+55 71 98888-8888' })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('phone', 'string'),
  })
  @MaxLength(40, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('phone', 40),
  })
  phone?: string;

  @ApiPropertyOptional({ type: UpdateAddressDto })
  @IsOptional()
  @ValidateNested({ message: CommonMessagesHelper.FIELD_INVALID('address') })
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
    format: 'uuid',
    description: 'ID do abrigo associado a este ponto de distribuição',
    nullable: true,
  })
  @IsOptional()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('shelterId', 'string'),
  })
  shelterId?: string | null;
}
