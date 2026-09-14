'use client'

import { Search, X, RotateCcw } from 'lucide-react'
import { LensMark } from './lens-mark'

type ToolbarProps = {
  filename: string
  totalRows: number
  totalCols: number
  visibleRows: number
  search: string
  onSearchChange: (value: string) => void
  onReset: () => void
}

export function Toolbar({
  filename,
  totalRows,
  totalCols,
  visibleRows,
  search,
  onSearchChange,
  onReset,
}: ToolbarProps) {
  return (
    <header className="flex shrink-0 flex-wrap items-center gap-4 border-b border-border bg-bg-elevated px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <LensMark size={18} background="var(--color-bg-elevated)" className="shrink-0 text-ink" />
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-[13px] font-semibold text-ink" title={filename}>
            {filename}
          </h1>
          <p className="font-mono text-[11px] tracking-tight text-ink-faint">
            {totalRows.toLocaleString()} rows · {totalCols} cols
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search rows"
            className="h-9 w-52 border border-border bg-surface pl-8 pr-8 text-sm text-ink outline-none placeholder:text-ink-faint focus-visible:border-accent"
            aria-label="Search rows"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-ink-faint hover:text-ink"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <span className="hidden font-mono text-[11px] text-ink-faint sm:inline">
          {visibleRows.toLocaleString()} / {totalRows.toLocaleString()}
        </span>

        <button
          type="button"
          onClick={onReset}
          className="flex h-9 items-center gap-1.5 border border-border px-3 text-[13px] font-medium text-ink-muted transition-colors hover:border-border-strong hover:text-ink motion-reduce:transition-none"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          New file
        </button>
      </div>
    </header>
  )
}
