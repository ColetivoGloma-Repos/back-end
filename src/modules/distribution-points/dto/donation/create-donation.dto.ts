import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { CommonMessagesHelper } from 'src/common/helpers';

export class CreateDonationDto {
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
  @Min(1, { message: CommonMessagesHelper.NUMBER_MIN('quantity', 1) })
  quantity!: number;

  @ApiPropertyOptional({
    example: '9f3a1e2c-3b4c-5d6e-7f80-1234567890ab',
    format: 'uuid',
    description: 'ID do usuário proprietário (apenas para administradores)',
  })
  @IsOptional()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('userId', 'string'),
  })
  userId?: string;
}
