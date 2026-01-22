import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { QueryRequest } from 'src/common/dto/query';
import { RequestedProductStatus } from '../../shared';

export class ListPointRequestedProductsDto extends QueryRequest {
  @ApiPropertyOptional({ example: '9f3a1e2c-3b4c-5d6e-7f80-1234567890ab' })
  @IsOptional()
  @IsUUID()
  pointId?: string;

  @ApiPropertyOptional({ example: '2a1b3c4d-5e6f-7081-92a3-b4c5d6e7f890' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({
    enum: RequestedProductStatus,
    example: RequestedProductStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(RequestedProductStatus)
  status?: RequestedProductStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Quando true, retorna apenas OPEN e FULL',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === false) return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ example: 'arroz' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  q?: string;
}
