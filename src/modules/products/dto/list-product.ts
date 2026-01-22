import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { QueryRequest } from 'src/common/dto/query';

export class ListProductsDto extends QueryRequest {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

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
}
