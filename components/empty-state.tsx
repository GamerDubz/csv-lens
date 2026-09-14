'use client'

import { useCallback, useRef, useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { LensMark } from './lens-mark'
import { CornerBrackets } from './corner-brackets'
import { DELIMITERS, type DelimiterValue } from '@/lib/csv'

type EmptyStateProps = {
  delimiter: DelimiterValue
  onDelimiterChange: (value: DelimiterValue) => void
  onFile: (file: File) => void
  error: string | null
}

export function EmptyState({ delimiter, onDelimiterChange, onFile, error }: EmptyStateProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6 py-16"
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Faint instrument-grid backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 45%, black 0%, transparent 75%)',
        }}
      />

      <div className="relative z-10 mb-10 flex items-center gap-2.5 text-ink">
        <LensMark size={22} background="var(--color-bg)" />
        <span className="font-sans text-[15px] font-semibold tracking-tight">CSV Lens</span>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="relative">
          <CornerBrackets active={isDragging} />
          <label
            className={`group flex w-full cursor-pointer flex-col items-center gap-4 border px-8 py-14 text-center transition-colors duration-200 motion-reduce:transition-none ${
              isDragging
                ? 'border-accent bg-accent-tint'
                : 'border-border bg-surface hover:border-border-strong'
            }`}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center border transition-colors duration-200 motion-reduce:transition-none ${
                isDragging ? 'border-accent text-accent' : 'border-border-strong text-ink-muted'
              }`}
            >
              <FolderOpen className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>

            <span className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                Awaiting input
              </span>
              <span className="text-base font-medium text-ink">
                Drop a CSV, or{' '}
                <span className="text-accent underline decoration-accent/40 underline-offset-4 group-hover:decoration-accent">
                  browse files
                </span>
              </span>
              <span className="text-sm text-ink-muted">
                Parsed entirely on this device. Nothing is uploaded.
              </span>
            </span>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onFile(file)
              }}
              aria-label="Choose a CSV, TSV, or text file to inspect"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-4 border border-accent-strong/30 bg-accent-tint px-3 py-2 text-sm text-accent-strong">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          <label htmlFor="delimiter-select" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Delimiter
          </label>
          <select
            id="delimiter-select"
            value={delimiter}
            onChange={(e) => onDelimiterChange(e.target.value as DelimiterValue)}
            className="min-h-[36px] cursor-pointer border border-border-strong bg-surface px-2.5 py-1 font-mono text-[13px] text-ink outline-none hover:border-ink-faint"
          >
            {DELIMITERS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
