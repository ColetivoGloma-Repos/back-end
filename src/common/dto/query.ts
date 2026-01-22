import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TrimToUndefined } from 'src/common/validation/trim.decorator';
import { CommonMessagesHelper } from 'src/common/helpers/common-messages.helper';

export class QueryRequest {
  @ApiPropertyOptional({ example: 10, minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('limit', 'integer'),
  })
  @Min(1, { message: CommonMessagesHelper.FIELD_MIN_LENGTH('limit', 1) })
  limit: number = 10;

  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('offset', 'integer'),
  })
  @Min(0, { message: CommonMessagesHelper.FIELD_MIN_LENGTH('offset', 0) })
  offset: number = 0;

  @ApiPropertyOptional({ example: 'createdAt', nullable: true })
  @IsOptional()
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('sortBy', 'string'),
  })
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'asc',
    enum: ['asc', 'desc'],
    nullable: true,
  })
  @IsOptional()
  @TrimToUndefined()
  @IsIn(['asc', 'desc'], {
    message: CommonMessagesHelper.FIELD_INVALID_ENUM('sort'),
  })
  sort?: string;

  @ApiPropertyOptional({
    example: 'Pesquisa',
    nullable: true,
    description: 'Texto para busca',
  })
  @IsOptional()
  @TrimToUndefined()
  @IsString({ message: CommonMessagesHelper.FIELD_INVALID_TYPE('q', 'string') })
  q?: string;
}
