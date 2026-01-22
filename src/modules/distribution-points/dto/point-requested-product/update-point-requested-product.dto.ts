import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { RequestedProductStatus } from '../../shared';

export class UpdatePointRequestedProductDto {
  @ApiPropertyOptional({ example: 150, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  requestedQuantity?: number;

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

  @ApiPropertyOptional({ example: '2026-01-21T12:00:00.000Z', nullable: true })
  @IsOptional()
  closesAt?: string | null;
}
