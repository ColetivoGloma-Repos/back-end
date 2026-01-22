import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { QueryRequest } from 'src/common/dto/query';
import { ToBoolean } from 'src/common/validation';

export class ListProductsDto extends QueryRequest {
  @ApiPropertyOptional({
    example: true,
    nullable: true,
    description: 'Filtra por produtos ativos/inativos',
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  active?: boolean;
}
