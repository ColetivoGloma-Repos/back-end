import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ToBoolean, Trim, TrimToUndefined } from 'src/common/validation';
import { CommonMessagesHelper } from 'src/common/helpers';

export class CreateProductDto {
  @ApiProperty({ example: 'Arroz' })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('name') })
  @Trim()
  @IsString({ message: CommonMessagesHelper.FIELD_INVALID('name', 'string') })
  @MaxLength(200, {
    message: CommonMessagesHelper.FIELD_INVALID_LENGTH('name'),
  })
  name!: string;

  @ApiPropertyOptional({ example: 'kg', nullable: true })
  @IsOptional()
  @TrimToUndefined()
  @IsString({ message: CommonMessagesHelper.FIELD_INVALID('unit', 'string') })
  @MaxLength(30, { message: CommonMessagesHelper.FIELD_INVALID_LENGTH('unit') })
  unit?: string | null;

  @ApiPropertyOptional({
    example: 'arroz',
    description: 'Opcional. Se não vier, o service gera.',
  })
  @IsOptional()
  @TrimToUndefined()
  @IsString({ message: CommonMessagesHelper.FIELD_INVALID('slug', 'string') })
  @MaxLength(200, {
    message: CommonMessagesHelper.FIELD_INVALID_LENGTH('slug'),
  })
  slug?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @ToBoolean()
  @IsBoolean({
    message: CommonMessagesHelper.FIELD_INVALID('active', 'boolean'),
  })
  active?: boolean;
}
