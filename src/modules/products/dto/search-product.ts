import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { QueryRequest } from 'src/common/dto/query';
import { ProductType } from '../enums/products.enum';
import { ProductStatus } from '../enums/product.status';

export class SearchProduct extends QueryRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  distribuitionPointId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  search: string;

  @ApiProperty({
    enum: ProductType,
    enumName: 'ProducatType',
    required: false,
  })
  @ValidateIf((o) => o.type !== '')
  @IsEnum(ProductType)
  @IsString()
  @IsOptional()
  type: string;

  @ApiProperty({
    enum: ProductType,
    enumName: 'ProducatType',
    required: false,
  })
  @ValidateIf((o) => o.type !== '')
  @IsEnum(ProductStatus)
  @IsString()
  @IsOptional()
  status: string;
}
