import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

export function PaginationControls({
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const normalizedPageSizeOptions = Array.from(new Set([...pageSizeOptions, pageSize])).sort(
    (a, b) => a - b,
  );

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className ?? ""}`.trim()}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Hiển thị</span>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {normalizedPageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span>bản ghi / trang</span>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!canPrev} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className="min-w-28 text-center text-sm text-muted-foreground">
          Trang {page} / {totalPages}
        </span>
        <Button type="button" variant="outline" size="sm" disabled={!canNext} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
