'use client'

import { X } from 'lucide-react'
import type { ColumnStats } from '@/lib/csv'

type ColumnInspectorProps = {
  columnName: string
  stats: ColumnStats
  onClose: () => void
}

export function ColumnInspector({ columnName, stats, onClose }: ColumnInspectorProps) {
  const rows: Array<[string, string]> =
    stats.type === 'numeric'
      ? [
          ['Type', 'Numeric'],
          ['Count', stats.count.toLocaleString()],
          ['Min', stats.min.toLocaleString()],
          ['Max', stats.max.toLocaleString()],
          ['Average', stats.avg.toFixed(2)],
          ['Median', stats.median.toFixed(2)],
          ['Sum', stats.sum.toLocaleString()],
          ['Empty', stats.empty.toLocaleString()],
        ]
      : [
          ['Type', 'Text'],
          ['Count', stats.count.toLocaleString()],
          ['Unique', stats.unique.toLocaleString()],
          ['Empty', stats.empty.toLocaleString()],
        ]

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-border bg-bg-elevated">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Column inspector
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center text-ink-faint hover:text-ink"
          aria-label="Close column inspector"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="border-b border-border px-4 py-3">
        <span
          className="block w-fit max-w-full truncate border-l-2 border-accent pl-2 text-sm font-semibold text-ink"
          title={columnName}
        >
          {columnName}
        </span>
      </div>

      <dl className="flex flex-1 flex-col divide-y divide-border overflow-y-auto">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
            <dt className="text-[13px] text-ink-muted">{label}</dt>
            <dd className="truncate font-mono text-[13px] font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
