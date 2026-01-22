import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';
import { CommonMessagesHelper } from 'src/common/helpers';

export class CreatePointRequestedProductDto {
  @ApiProperty({
    example: '9f3a1e2c-3b4c-5d6e-7f80-1234567890ab',
    format: 'uuid',
    description: 'ID do ponto',
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('pointId') })
  @IsUUID('4', {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('pointId', 'uuid'),
  })
  pointId: string;

  @ApiProperty({
    example: '2a1b3c4d-5e6f-7081-92a3-b4c5d6e7f890',
    format: 'uuid',
    description: 'ID do produto',
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('productId') })
  @IsUUID('4', {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('productId', 'uuid'),
  })
  productId: string;

  @ApiProperty({
    example: 100,
    minimum: 0,
    description: 'Quantidade solicitada (inteiro maior ou igual a 0)',
  })
  @IsInt({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE(
      'requestedQuantity',
      'integer',
    ),
  })
  @Min(0, { message: CommonMessagesHelper.FIELD_INVALID('requestedQuantity') })
  requestedQuantity: number;
}
