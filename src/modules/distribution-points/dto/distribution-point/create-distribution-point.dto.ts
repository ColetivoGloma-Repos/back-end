import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from 'src/modules/auth/dto/adress.dto';
import { DistributionPointStatus } from '../../shared';
import { CreateProductDto } from 'src/modules/products/dto';

export class CreateRequestedProductDto extends OmitType(CreateProductDto, [
  'active',
] as const) {
  @ApiProperty({ example: 100, minimum: 0 })
  @Min(0)
  requestedQuantity!: number;
}

export class CreateDistributionPointDto {
  @ApiProperty({ example: 'Ponto Central' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title!: string;

  @ApiPropertyOptional({ example: 'Ponto para arrecadação', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiProperty({ example: '+55 71 99999-9999' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone!: string;

  @ApiProperty({ example: '9f3a1e2c-3b4c-5d6e-7f80-1234567890ab' })
  @IsUUID()
  @IsNotEmpty()
  ownerId!: string;

  @ApiPropertyOptional({
    enum: DistributionPointStatus,
    example: DistributionPointStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(DistributionPointStatus)
  status?: DistributionPointStatus;

  @ApiProperty({ type: CreateAddressDto })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address!: CreateAddressDto;

  @ApiProperty({
    type: [CreateRequestedProductDto],
    example: [
      { productId: '2a1b3c4d-5e6f-7081-92a3-b4c5d6e7f890', requestedQty: 100 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRequestedProductDto)
  requestedProducts!: CreateRequestedProductDto[];
}
