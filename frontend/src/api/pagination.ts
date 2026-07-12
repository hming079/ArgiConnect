export interface PageParams {
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export function unwrapPage<T>(data: T[] | PageResponse<T>): T[] {
  return Array.isArray(data) ? data : data.content;
}

export function normalizePage<T>(data: T[] | PageResponse<T>, page = 0, size = 20): PageResponse<T> {
  if (!Array.isArray(data)) return data;
  return {
    content: data,
    number: page,
    size,
    totalElements: data.length,
    totalPages: data.length === 0 ? 0 : Math.ceil(data.length / size),
  };
}
