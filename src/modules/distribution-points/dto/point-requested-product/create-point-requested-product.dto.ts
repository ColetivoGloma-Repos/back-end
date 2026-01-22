import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreatePointRequestedProductDto {
  @ApiProperty({ example: '9f3a1e2c-3b4c-5d6e-7f80-1234567890ab' })
  @IsUUID()
  @IsNotEmpty()
  pointId: string;

  @ApiProperty({ example: '2a1b3c4d-5e6f-7081-92a3-b4c5d6e7f890' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 100, minimum: 0 })
  @IsInt()
  @Min(0)
  requestedQuantity: number;
}
