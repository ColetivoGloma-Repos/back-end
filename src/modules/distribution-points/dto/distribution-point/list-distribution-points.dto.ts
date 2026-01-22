import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { QueryRequest } from 'src/common/dto/query';

export class ListDistributionPointsDto extends QueryRequest {
  @ApiPropertyOptional({ example: '9f3a1e2c-3b4c-5d6e-7f80-1234567890ab' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === false) return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: 'Salvador' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: 'BA' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional({ example: 'central' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
