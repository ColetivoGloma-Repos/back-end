import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { CommonMessagesHelper } from 'src/common/helpers/common-messages.helper';
import { ToBoolean, TrimToUndefined } from 'src/common/validation';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Arroz', maxLength: 200, nullable: true })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('name', 'string'),
  })
  @MaxLength(200, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('name', 200),
  })
  name?: string;

  @ApiPropertyOptional({ example: 'kg', maxLength: 30, nullable: true })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('unit', 'string'),
  })
  @MaxLength(30, { message: CommonMessagesHelper.FIELD_MAX_LENGTH('unit', 30) })
  unit?: string | null;

  @ApiPropertyOptional({
    example: true,
    nullable: true,
    description: 'Aceita true/false/1/0 via query/body e converte para boolean',
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('active', 'boolean'),
  })
  active?: boolean;

  @ApiPropertyOptional({
    example: 'arroz',
    maxLength: 200,
    nullable: true,
    description: 'Opcional. Se não vier, o service pode gerar.',
  })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('slug', 'string'),
  })
  @MaxLength(200, {
    message: CommonMessagesHelper.FIELD_MAX_LENGTH('slug', 200),
  })
  slug?: string;
}
