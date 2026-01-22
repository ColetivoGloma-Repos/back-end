import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateDonationDto {
  @ApiPropertyOptional({
    example: 2,
    minimum: 0,
    description: 'Permite reduzir (0) ou ajustar a quantidade da doação',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;
}
