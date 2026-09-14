'use client'

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

const ROW_CAP = 1000

type DataGridProps = {
  headers: string[]
  rows: string[][]
  totalMatched: number
  sortCol: number | null
  sortDir: 'asc' | 'desc'
  selectedCol: number | null
  onHeaderClick: (colIndex: number) => void
}

export function DataGrid({
  headers,
  rows,
  totalMatched,
  sortCol,
  sortDir,
  selectedCol,
  onHeaderClick,
}: DataGridProps) {
  const visibleRows = rows.slice(0, ROW_CAP)

  return (
    <div className="flex-1 overflow-auto bg-surface">
      <table className="w-full min-w-full border-collapse font-mono text-[13px]">
        <thead className="sticky top-0 z-10 bg-bg-elevated">
          <tr>
            <th
              scope="col"
              className="w-12 border-b border-border px-3 py-2 text-left text-[11px] font-medium text-ink-faint"
            >
              #
            </th>
            {headers.map((header, colIndex) => {
              const isSorted = sortCol === colIndex
              const isSelected = selectedCol === colIndex
              return (
                <th
                  key={colIndex}
                  scope="col"
                  aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className={`border-b p-0 text-left whitespace-nowrap ${
                    isSelected ? 'border-b-accent bg-accent-tint' : 'border-border'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onHeaderClick(colIndex)}
                    className={`group flex min-h-[36px] w-full items-center gap-1.5 px-3 py-2 text-left text-[13px] font-medium transition-colors motion-reduce:transition-none ${
                      isSelected ? 'text-accent-strong' : 'text-ink hover:bg-bg-elevated'
                    }`}
                  >
                    <span className="truncate">{header || `Column ${colIndex + 1}`}</span>
                    {isSorted ? (
                      sortDir === 'asc' ? (
                        <ArrowUp className="h-3 w-3 shrink-0" aria-hidden="true" />
                      ) : (
                        <ArrowDown className="h-3 w-3 shrink-0" aria-hidden="true" />
                      )
                    ) : (
                      <ArrowUpDown
                        className="h-3 w-3 shrink-0 text-ink-faint opacity-0 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border/60 hover:bg-bg-elevated">
              <td className="px-3 py-1.5 text-ink-faint tabular-nums">{rowIndex + 1}</td>
              {headers.map((_, colIndex) => (
                <td
                  key={colIndex}
                  className={`max-w-[240px] truncate px-3 py-1.5 text-ink ${
                    selectedCol === colIndex ? 'bg-accent-tint/50' : ''
                  }`}
                  title={row[colIndex] ?? ''}
                >
                  {row[colIndex] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {totalMatched > ROW_CAP && (
        <p className="border-t border-border px-4 py-3 text-center font-mono text-[11px] text-ink-faint">
          Showing first {ROW_CAP.toLocaleString()} of {totalMatched.toLocaleString()} matching rows
        </p>
      )}

      {totalMatched === 0 && (
        <p className="px-4 py-10 text-center text-sm text-ink-muted">No rows match your search.</p>
      )}
    </div>
  )
}
