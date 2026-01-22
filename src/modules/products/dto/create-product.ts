import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Arroz' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'kg', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string | null;

  @ApiPropertyOptional({
    example: 'arroz',
    description: 'Opcional. Se não vier, o service gera.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
