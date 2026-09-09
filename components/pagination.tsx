"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationControlsProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
  variant?: "glass" | "admin" | "light" | "amber" | "dark";
}

export function PaginationControls({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 20, 25, 50, 100],
  itemLabel = "items",
  className = "",
  variant = "glass",
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Generate page numbers array with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const isAmber = variant === "amber";

  // Variant color definitions
  const containerClasses = isAmber
    ? "border-t border-amber-900/20 bg-amber-950/20 rounded-b-xl text-amber-200/90"
    : "border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-2xl shadow-xs text-slate-700 dark:text-slate-200";

  const badgeClasses = isAmber
    ? "font-bold text-amber-100 bg-amber-900/40 px-2 py-0.5 rounded-md"
    : "font-bold text-slate-900 dark:text-amber-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60";

  const labelClasses = isAmber ? "text-amber-200/60" : "text-slate-500 dark:text-slate-400 font-semibold";

  const selectClasses = isAmber
    ? "bg-amber-950/80 border border-amber-800/50 rounded-lg px-2.5 py-1 text-xs text-amber-100 focus:outline-none focus:border-amber-500"
    : "bg-white/95 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs focus:outline-none focus:ring-2 focus:ring-orange/40 transition-all";

  const optionClasses = isAmber ? "bg-neutral-900 text-amber-100" : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100";

  const navButtonClasses = isAmber
    ? "border border-amber-800/30 text-amber-200 hover:bg-amber-900/40"
    : "border border-slate-200 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-orange-light hover:text-orange hover:border-orange/30 shadow-xs";

  const activePageClasses = isAmber
    ? "bg-amber-500 text-neutral-950 font-extrabold shadow-sm shadow-amber-500/30 scale-105"
    : "bg-orange text-white font-extrabold shadow-md shadow-orange/30 scale-105 border-transparent";

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-5 text-xs sm:text-sm ${containerClasses} ${className}`}>
      {/* Left side: Item Count & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 flex-wrap">
          Showing <span className={badgeClasses}>{startItem}</span>–
          <span className={badgeClasses}>{endItem}</span> of{" "}
          <span className={badgeClasses}>{totalItems}</span> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className={`flex items-center gap-2 ml-0 sm:ml-2 pl-0 sm:pl-3 border-l-0 sm:border-l ${isAmber ? "border-amber-900/30" : "border-slate-200 dark:border-slate-800"}`}>
            <label htmlFor="page-size-select" className={`text-xs whitespace-nowrap ${labelClasses}`}>
              Per page:
            </label>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={selectClasses}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className={optionClasses}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Page Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            aria-label="Previous page"
            className={`flex items-center justify-center p-2 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed ${navButtonClasses}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className={`px-2 font-bold ${isAmber ? "text-amber-200/40" : "text-slate-400"}`}>
                    ...
                  </span>
                );
              }

              const isCurrent = p === safePage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(Number(p))}
                  className={`min-w-[2.25rem] h-9 px-2 rounded-xl text-xs font-bold transition-all ${
                    isCurrent ? activePageClasses : navButtonClasses
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            aria-label="Next page"
            className={`flex items-center justify-center p-2 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed ${navButtonClasses}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
