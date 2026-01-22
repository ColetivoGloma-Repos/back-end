import { ApiPropertyOptional } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { TrimToUndefined } from 'src/common/validation/trim.decorator';
import { CommonMessagesHelper } from 'src/common/helpers/common-messages.helper';

type QueryNumberStringOptions = {
  field: string;
  min?: number;
  max?: number;
};

function toSafeInt(value: unknown): number | null {
  if (value === undefined || value === null) return null;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    if (!Number.isInteger(value)) return null;
    return value;
  }

  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw.length) return null;
    if (!/^-?\d+$/.test(raw)) return null;

    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if (!Number.isInteger(n)) return null;

    return n;
  }

  return null;
}

export function QueryNumberString(options: QueryNumberStringOptions) {
  const { field, min, max } = options;

  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;

    const safedInt = toSafeInt(value);
    if (safedInt === null) {
      throw new BadRequestException(
        CommonMessagesHelper.FIELD_INVALID_TYPE(field, 'integer'),
      );
    }

    if (min !== undefined && safedInt < min) {
      throw new BadRequestException(
        CommonMessagesHelper.NUMBER_MIN(field, min),
      );
    }

    if (max !== undefined && safedInt > max) {
      throw new BadRequestException(
        CommonMessagesHelper.NUMBER_MAX(field, max),
      );
    }

    return String(safedInt);
  });
}

export class QueryRequest {
  @ApiPropertyOptional({
    example: '10',
    minimum: 1,
    default: '10',
    description: 'Quantidade de itens por página (query string)',
  })
  @IsOptional()
  @QueryNumberString({ field: 'limit', min: 1 })
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('limit', 'string'),
  })
  limit?: string;

  @ApiPropertyOptional({
    example: '0',
    minimum: 0,
    default: '0',
    description: 'Offset da paginação (query string)',
  })
  @IsOptional()
  @QueryNumberString({ field: 'offset', min: 0 })
  @TrimToUndefined()
  @IsString({
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('offset', 'string'),
  })
  offset?: string;

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
