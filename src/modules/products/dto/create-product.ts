import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsDecimal, IsEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ProductType } from '../enums/products.enum';
import { Type } from 'class-transformer';
import { ProductStatus } from '../enums/product.status';

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
  @IsString()
  @IsOptional()
  status: ProductStatus;

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
  distributionPointId: string;

  

}
