import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TrimToUndefined } from 'src/common/validation/trim.decorator';
import { CommonMessagesHelper } from 'src/common/helpers/common-messages.helper';

export class QueryRequest {
  @ApiPropertyOptional({ example: 10, minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: CommonMessagesHelper.FIELD_INVALID('limit', 'int') })
  @Min(1, { message: CommonMessagesHelper.FIELD_INVALID('limit', 'min') })
  limit: number = 10;

  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: CommonMessagesHelper.FIELD_INVALID('offset', 'int') })
  @Min(0, { message: CommonMessagesHelper.FIELD_INVALID('offset', 'min') })
  offset: number = 0;

  @ApiPropertyOptional({ example: 'createdAt', nullable: true })
  @TrimToUndefined()
  @IsOptional()
  @IsString({ message: CommonMessagesHelper.FIELD_INVALID('sortBy', 'string') })
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'asc',
    enum: ['asc', 'desc'],
    nullable: true,
  })
  @IsOptional()
  @TrimToUndefined()
  @IsIn(['asc', 'desc'], {
    message: CommonMessagesHelper.FIELD_INVALID('sort', 'asc|desc'),
  })
  sort?: string;

  @ApiPropertyOptional({ example: 'arroz', nullable: true })
  @IsOptional()
  @TrimToUndefined()
  @IsString({ message: CommonMessagesHelper.FIELD_INVALID('q', 'string') })
  q?: string;
}
