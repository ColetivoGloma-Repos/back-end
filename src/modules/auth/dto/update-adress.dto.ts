import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: '40000000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cep?: string;

  @ApiPropertyOptional({ example: 'BA' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  estado?: string;

  @ApiPropertyOptional({ example: 'Brasil' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  pais?: string;

  @ApiPropertyOptional({ example: 'Salvador' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  municipio?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bairro?: string;

  @ApiPropertyOptional({ example: 'Rua Exemplo' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  logradouro?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  numero?: string;

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
