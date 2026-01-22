import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateDonationDto {
  @ApiProperty({ example: 'b2a3c4d5-e6f7-4890-8123-4567890abcde' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-4901-9234-567890abcdef' })
  @IsUUID()
  @IsNotEmpty()
  requestedProductId!: string;

  @ApiProperty({ example: 5, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}
