import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsDecimal, IsEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ProductType } from '../enums/products.enum';
import { Type } from 'class-transformer';

export class CreateProduct {
  @ApiHideProperty()
  @IsEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type: ProductType;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  weight: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  distributionPointId: string;
}
