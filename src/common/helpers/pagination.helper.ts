import { QueryRequest } from '../dto/query';

export interface PaginationOptions {
  skip: number;
  take: number;
  page: number;
  limit: number;
  offset: number;
  order?: Record<string, 'ASC' | 'DESC'>;
}

export function buildPagination(
  query: QueryRequest,
  defaultSort?: Record<string, 'ASC' | 'DESC'>,
): PaginationOptions {
  const limit = Math.max(1, Number(query.limit ?? 10));
  const offset = Math.max(0, Number(query.offset ?? 0));
  const skip = offset;
  const take = limit;
  const page = Math.floor(skip / limit) + 1;

  let order: Record<string, 'ASC' | 'DESC'> | undefined = defaultSort;

  if (query.sortBy) {
    const direction = query.sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    order = {
      [query.sortBy]: direction,
    };
  }

  return {
    skip,
    take,
    page,
    limit,
    offset,
    order,
  };
}
