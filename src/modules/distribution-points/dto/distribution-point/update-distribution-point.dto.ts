import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UpdateAddressDto } from 'src/modules/auth/dto/update-adress.dto';
import { DistributionPointStatus } from '../../shared';

export class UpdateDistributionPointDto {
  @ApiPropertyOptional({ example: 'Ponto Central Atualizado' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @ApiPropertyOptional({ example: 'Descrição atualizada', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ example: '+55 71 98888-8888' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({
    enum: DistributionPointStatus,
    example: DistributionPointStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(DistributionPointStatus)
  status?: DistributionPointStatus;

  @ApiPropertyOptional({ type: UpdateAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto;
}
