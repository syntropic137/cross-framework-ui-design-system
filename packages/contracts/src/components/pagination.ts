export interface PaginationContract {
  page: number;
  count: number;
  onPageChange?: (page: number) => void;
  perPage?: number;
  siblingCount?: number;
}
