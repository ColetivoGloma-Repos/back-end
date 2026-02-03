import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CommonMessagesHelper } from 'src/common/helpers';

export class DeleteDonationDto {
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
