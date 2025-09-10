import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ProductType } from '../enums/products.enum';
import { Type } from 'class-transformer';
import { ProductStatus } from '../enums/product.status';

export class CreateProductDonate {

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
  productReferenceID: string;  

}
