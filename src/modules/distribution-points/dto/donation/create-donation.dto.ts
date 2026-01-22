import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';
import { CommonMessagesHelper } from 'src/common/helpers';

export class CreateDonationDto {
  @ApiProperty({
    example: 'b2a3c4d5-e6f7-4890-8123-4567890abcde',
    format: 'uuid',
    description: 'ID do usuário',
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('userId') })
  @IsUUID('4', {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('userId', 'uuid'),
  })
  userId!: string;

  @ApiProperty({
    example: 'c3d4e5f6-a7b8-4901-9234-567890abcdef',
    format: 'uuid',
    description: 'ID do produto solicitado',
  })
  @IsNotEmpty({
    message: CommonMessagesHelper.FIELD_IS_REQUIRED('requestedProductId'),
  })
  @IsUUID('4', {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE(
      'requestedProductId',
      'uuid',
    ),
  })
  requestedProductId!: string;

  @ApiProperty({
    example: 5,
    minimum: 1,
    description: 'Quantidade doada (inteiro maior ou igual a 1)',
  })
  @IsInt({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('quantity', 'integer'),
  })
  @Min(1, { message: CommonMessagesHelper.FIELD_MIN_LENGTH('quantity', 1) })
  quantity!: number;
}
