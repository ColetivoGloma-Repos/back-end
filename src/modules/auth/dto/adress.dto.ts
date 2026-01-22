import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: '40000000' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cep!: string;

  @ApiProperty({ example: 'BA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  estado!: string;

  @ApiProperty({ example: 'Brasil' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  pais!: string;

  @ApiProperty({ example: 'Salvador' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  municipio!: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  bairro!: string;

  @ApiProperty({ example: 'Rua Exemplo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  logradouro!: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  numero!: string;

  @ApiPropertyOptional({ example: 'Apto 101', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  complemento?: string | null;

  @ApiPropertyOptional({ example: -12.9714, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional({ example: -38.5014, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null;
}
