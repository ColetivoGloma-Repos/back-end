import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductType } from '../enums/products.enum';
import { Type } from 'class-transformer';

export class UpdateProduct {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type: ProductType;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
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
}
