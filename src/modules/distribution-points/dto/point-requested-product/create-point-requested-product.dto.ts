import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { CommonMessagesHelper } from 'src/common/helpers';
import { CreateProductDto } from 'src/modules/products/dto';

export class CreateRequestedProductDto extends OmitType(CreateProductDto, [
  'active',
] as const) {
  @ApiProperty({
    example: 100,
    minimum: 1,
    description: 'Quantidade solicitada (mínimo 1)',
  })
  @IsInt({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE(
      'requestedQuantity',
      'integer',
    ),
  })
  @Min(1, {
    message: CommonMessagesHelper.NUMBER_MIN('requestedQuantity', 1),
  })
  requestedQuantity!: number;
}

export class CreatePointRequestedProductDto {
  @ApiProperty({
    example: '9f3a1e2c-3b4c-5d6e-7f80-1234567890ab',
    format: 'uuid',
    description: 'ID do ponto',
  })
  @IsNotEmpty({
    message: CommonMessagesHelper.FIELD_IS_REQUIRED('distributionPointId'),
  })
  @IsUUID('4', {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE(
      'distributionPointId',
      'uuid',
    ),
  })
  distributionPointId: string;

  @ApiProperty({
    type: [CreateRequestedProductDto],
    example: [
      {
        productId: '2a1b3c4d-5e6f-7081-92a3-b4c5d6e7f890',
        requestedQuantity: 100,
      },
    ],
  })
  @IsArray({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE(
      'requestedProducts',
      'array',
    ),
  })
  @ValidateNested({ each: true })
  @Type(() => CreateRequestedProductDto)
  requestedProducts!: CreateRequestedProductDto[];
}
