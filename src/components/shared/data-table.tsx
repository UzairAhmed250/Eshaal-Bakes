"use client";

import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import {
  EmptyState,
  Pagination,
  SkeletonLoader,
} from "@/components/shared/display-components";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  renderMobileCard?: (row: T) => React.ReactNode;
}

/**
 * Shared DataTable with sorting, pagination, loading skeleton, empty state,
 * and automatic mobile card layout on screens < 768px.
 */
export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  pageSize = 10,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters or search criteria.",
  renderMobileCard,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortValue) return data;

    return [...data].sort((a, b) => {
      const valA = col.sortValue!(a);
      const valB = col.sortValue!(b);
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (isLoading) {
    return <SkeletonLoader rows={4} />;
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {/* Mobile card view (< md) */}
      {renderMobileCard && (
        <div className="space-y-3 md:hidden">
          {paginatedData.map((row) => (
            <React.Fragment key={keyExtractor(row)}>
              {renderMobileCard(row)}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Desktop tabular view */}
      <div
        className={
          renderMobileCard
            ? "hidden overflow-x-auto rounded-xl border bg-card md:block"
            : "overflow-x-auto rounded-xl border bg-card"
        }
      >
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3">
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedData.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="transition-colors hover:bg-muted/30"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 align-middle">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
