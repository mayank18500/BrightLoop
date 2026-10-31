import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "../../utils/cn";
import { SearchInput } from "./SearchInput";
import { TableSkeleton } from "./LoadingSkeleton";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  pageSize?: number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  headerActions?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchPlaceholder = "Search records...",
  searchFilter,
  pageSize = 10,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries matching the current filter criteria.",
  onRowClick,
  headerActions,
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter items
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    if (searchFilter) {
      return data.filter((item) => searchFilter(item, searchQuery));
    }
    // Default fallback string search across all primitive values
    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      Object.values(item as Record<string, unknown>).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [data, searchQuery, searchFilter]);

  // Sort items
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortColumn];
      const bVal = (b as Record<string, unknown>)[sortColumn];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const compare = String(aVal) < String(bVal) ? -1 : 1;
      return sortDirection === "asc" ? compare : -compare;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
      }
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={pageSize} columns={columns.length} />;
  }

  return (
    <div className={cn("card-surface overflow-hidden", className)}>
      {/* Top Filter & Actions Header */}
      {(searchable || headerActions) && (
        <div className="p-4 border-b border-[#E8EAF0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          {searchable ? (
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchQuery}
                onChange={(q) => {
                  setSearchQuery(q);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
              />
            </div>
          ) : (
            <div />
          )}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Table Canvas */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFBFD] border-b border-[#E8EAF0] text-[11px] font-semibold text-[#758096] uppercase tracking-wider">
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    className={cn(
                      "px-4 py-3 select-none",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.sortable && "cursor-pointer hover:text-[#202938]"
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        col.align === "right" && "justify-end w-full",
                        col.align === "center" && "justify-center w-full"
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-[#9CA3AF]">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-[#4169E1]" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-[#4169E1]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F6] text-xs text-[#202938] bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-[#758096]">
                  <p className="font-semibold text-sm text-[#202938] mb-1">{emptyTitle}</p>
                  <p className="text-xs text-[#758096] max-w-sm mx-auto">{emptyDescription}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => {
                const key = keyExtractor(item);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      "transition-colors",
                      onRowClick ? "cursor-pointer hover:bg-[#F9FAFC]" : "hover:bg-[#FAFBFD]"
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3.5 whitespace-nowrap",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center"
                        )}
                      >
                        {col.render
                          ? col.render(item, idx)
                          : String((item as Record<string, unknown>)[col.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="px-4 py-3 border-t border-[#E8EAF0] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#758096]">
          <div>
            Showing <span className="font-semibold text-[#202938]">{startIndex + 1}</span> to{" "}
            <span className="font-semibold text-[#202938]">
              {Math.min(startIndex + pageSize, totalItems)}
            </span>{" "}
            of <span className="font-semibold text-[#202938]">{totalItems}</span> results
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-[#E8EAF0] hover:bg-[#F8F9FA] text-[#202938] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-2 font-medium text-[#202938]">
                Page {validCurrentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#E8EAF0] hover:bg-[#F8F9FA] text-[#202938] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
