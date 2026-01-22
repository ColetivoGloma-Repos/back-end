import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { CommonMessagesHelper } from 'src/common/helpers/common-messages.helper';
import { TrimToUndefined } from 'src/common/validation/trim.decorator';

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: '40000000' })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('cep', 'string'),
  })
  @MaxLength(20, { message: CommonMessagesHelper.FIELD_MAX_LENGTH('cep', 20) })
  cep?: string;

  @ApiPropertyOptional({ example: 'BA' })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('estado', 'string'),
  })
  @MaxLength(80, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('estado', 80),
  })
  estado?: string;

  @ApiPropertyOptional({ example: 'Brasil' })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('pais', 'string'),
  })
  @MaxLength(120, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('pais', 120),
  })
  pais?: string;

  @ApiPropertyOptional({ example: 'Salvador' })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('municipio', 'string'),
  })
  @MaxLength(120, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('municipio', 120),
  })
  municipio?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('bairro', 'string'),
  })
  @MaxLength(120, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('bairro', 120),
  })
  bairro?: string;

  @ApiPropertyOptional({ example: 'Rua Exemplo' })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('logradouro', 'string'),
  })
  @MaxLength(180, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('logradouro', 180),
  })
  logradouro?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('numero', 'string'),
  })
  @MaxLength(30, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('numero', 30),
  })
  numero?: string;

  @ApiPropertyOptional({ example: 'Apto 101', nullable: true })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('complemento', 'string'),
  })
  @MaxLength(120, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('complemento', 120),
  })
  complemento?: string | null;

  @ApiPropertyOptional({ example: -12.9714, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    { message: CommonMessagesHelper.FIELD_INVALID_TYPE('latitude', 'number') },
  )
  latitude?: number | null;

  @ApiPropertyOptional({ example: -38.5014, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    { message: CommonMessagesHelper.FIELD_INVALID_TYPE('longitude', 'number') },
  )
  longitude?: number | null;
}
