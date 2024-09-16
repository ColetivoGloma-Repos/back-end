import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ProducatType } from '../enums/products.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProduct {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type: ProducatType;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  weight: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;
}
