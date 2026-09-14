'use client'

import { useCallback, useMemo, useState } from 'react'
import { EmptyState } from '@/components/empty-state'
import { Toolbar } from '@/components/toolbar'
import { DataGrid } from '@/components/data-grid'
import { ColumnInspector } from '@/components/column-inspector'
import { parseCSV, getColumnStats, filterRows, sortRows, type ParsedCSV, type DelimiterValue } from '@/lib/csv'

export default function CSVLensPage() {
  const [parsed, setParsed] = useState<ParsedCSV | null>(null)
  const [filename, setFilename] = useState('')
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedCol, setSelectedCol] = useState<number | null>(null)
  const [delimiter, setDelimiter] = useState<DelimiterValue>('auto')
  const [error, setError] = useState<string | null>(null)

  const loadFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        const result = parseCSV(text, delimiter)
        if (!result.headers.length) {
          setError('That file has no readable rows. Try a different delimiter or file.')
          return
        }
        setError(null)
        setFilename(file.name)
        setParsed(result)
        setSelectedCol(null)
        setSortCol(null)
        setSearch('')
      } catch {
        setError('Could not read that file. Make sure it is a plain-text CSV, TSV, or delimited file.')
      }
    },
    [delimiter]
  )

  const handleReset = useCallback(() => {
    setParsed(null)
    setFilename('')
    setSearch('')
    setSortCol(null)
    setSelectedCol(null)
    setError(null)
  }, [])

  const handleHeaderClick = useCallback(
    (colIndex: number) => {
      setSelectedCol(colIndex)
      setSortCol((current) => {
        if (current === colIndex) {
          setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
          return current
        }
        setSortDir('asc')
        return colIndex
      })
    },
    []
  )

  const visibleRows = useMemo(() => {
    if (!parsed) return []
    let rows = filterRows(parsed.rows, search)
    if (sortCol !== null) rows = sortRows(rows, sortCol, sortDir)
    return rows
  }, [parsed, search, sortCol, sortDir])

  const columnStats = useMemo(() => {
    if (!parsed || selectedCol === null) return null
    return getColumnStats(parsed.rows, selectedCol)
  }, [parsed, selectedCol])

  if (!parsed) {
    return (
      <EmptyState
        delimiter={delimiter}
        onDelimiterChange={setDelimiter}
        onFile={loadFile}
        error={error}
      />
    )
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Toolbar
        filename={filename}
        totalRows={parsed.rows.length}
        totalCols={parsed.headers.length}
        visibleRows={visibleRows.length}
        search={search}
        onSearchChange={setSearch}
        onReset={handleReset}
      />

      <div className="flex flex-1 overflow-hidden">
        <DataGrid
          headers={parsed.headers}
          rows={visibleRows}
          totalMatched={visibleRows.length}
          sortCol={sortCol}
          sortDir={sortDir}
          selectedCol={selectedCol}
          onHeaderClick={handleHeaderClick}
        />

        {columnStats && selectedCol !== null && (
          <ColumnInspector
            columnName={parsed.headers[selectedCol] || `Column ${selectedCol + 1}`}
            stats={columnStats}
            onClose={() => setSelectedCol(null)}
          />
        )}
      </div>
    </div>
  )
}
