import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
} from 'class-validator';
import { CommonMessagesHelper } from 'src/common/helpers/common-messages.helper';
import { TrimToUndefined } from 'src/common/validation/trim.decorator';

export class CreateAddressDto {
  @ApiProperty({ example: '40000000' })
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('cep', 'string'),
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('cep') })
  @MaxLength(20, { message: CommonMessagesHelper.FIELD_MAX_LENGTH('cep', 20) })
  cep!: string;

  @ApiProperty({ example: 'BA' })
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('estado', 'string'),
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('estado') })
  @MaxLength(80, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('estado', 80),
  })
  estado!: string;

  @ApiProperty({ example: 'Brasil' })
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('pais', 'string'),
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('pais') })
  @MaxLength(120, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('pais', 120),
  })
  pais!: string;

  @ApiProperty({ example: 'Salvador' })
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('municipio', 'string'),
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('municipio') })
  @MaxLength(120, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('municipio', 120),
  })
  municipio!: string;

  @ApiProperty({ example: 'Centro' })
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('bairro', 'string'),
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('bairro') })
  @MaxLength(120, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('bairro', 120),
  })
  bairro!: string;

  @ApiProperty({ example: 'Rua Exemplo' })
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('logradouro', 'string'),
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('logradouro') })
  @MaxLength(180, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('logradouro', 180),
  })
  logradouro!: string;

  @ApiProperty({ example: '123' })
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('numero', 'string'),
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('numero') })
  @MaxLength(30, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('numero', 30),
  })
  numero!: string;

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
