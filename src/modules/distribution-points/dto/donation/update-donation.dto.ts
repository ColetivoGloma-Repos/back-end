import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { CommonMessagesHelper } from 'src/common/helpers/common-messages.helper';

export class UpdateDonationDto {
  @ApiPropertyOptional({
    example: 2,
    minimum: 0,
    description: 'Permite reduzir (0) ou ajustar a quantidade da doação',
  })
  @IsOptional()
  @IsInt({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('quantity', 'integer'),
  })
  @Min(0, { message: CommonMessagesHelper.FIELD_MIN_LENGTH('quantity', 0) })
  quantity?: number;
}
