export interface PaginateResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export async function paginate<T>(
  repository: { findAndCount: (arg0: { where: any; order: any; skip: number; take: number; }) => PromiseLike<[any, any]> | [any, any]; },
  options: { page?: number; limit?: number; where?: any; order?: any }
): Promise<PaginateResult<T>> {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const [data, total] = await repository.findAndCount({
    where: options.where,
    order: options.order,
    skip: (page - 1) * limit,
    take: limit,
  });

  return { data, total, page, limit };
}