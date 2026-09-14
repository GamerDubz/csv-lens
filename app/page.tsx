'use client'

import { useState, useCallback, useRef } from 'react'

type ParsedCSV = { headers: string[]; rows: string[][] }

function parseCSV(text: string, delimiter = ','): ParsedCSV {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return { headers: [], rows: [] }

  // Auto-detect delimiter
  if (delimiter === 'auto') {
    const firstLine = lines[0]
    const delimiters = [',', '\t', ';', '|']
    delimiter = delimiters.reduce((best, d) => {
      return firstLine.split(d).length > firstLine.split(best).length ? d : best
    }, ',')
  }

  const parseRow = (line: string): string[] => {
    const cells: string[] = []; let inQuotes = false; let cell = ''
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes }
      else if (line[i] === delimiter && !inQuotes) { cells.push(cell); cell = '' }
      else { cell += line[i] }
    }
    cells.push(cell)
    return cells
  }

  const headers = parseRow(lines[0])
  const rows = lines.slice(1).map(parseRow)
  return { headers, rows }
}

function getColumnStats(rows: string[][], colIdx: number) {
  const vals = rows.map((r) => r[colIdx] ?? '').filter(Boolean)
  const nums = vals.map(Number).filter((n) => !isNaN(n))
  const isNumeric = nums.length > vals.length * 0.8
  if (!isNumeric || !nums.length) {
    const unique = new Set(vals).size
    return { type: 'text', count: vals.length, unique, empty: rows.length - vals.length }
  }
  const sum = nums.reduce((a, b) => a + b, 0)
  const sorted = [...nums].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  return { type: 'numeric', count: nums.length, min: sorted[0], max: sorted[sorted.length - 1], avg: sum / nums.length, median, sum, empty: rows.length - nums.length }
}

export default function CSVLensPage() {
  const [parsed, setParsed] = useState<ParsedCSV | null>(null)
  const [filename, setFilename] = useState('')
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedCol, setSelectedCol] = useState<number | null>(null)
  const [delimiter, setDelimiter] = useState('auto')
  const fileRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback(async (file: File) => {
    setFilename(file.name)
    const text = await file.text()
    setParsed(parseCSV(text, delimiter))
    setSelectedCol(null); setSortCol(null)
  }, [delimiter])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) loadFile(f)
  }, [loadFile])

  const handleSort = (col: number) => {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  if (!parsed) {
    return (
      <div
        className="min-h-screen bg-[#0f0f0f] text-neutral-100 flex items-center justify-center p-8"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">📊</div>
          <h1 className="text-2xl font-bold mb-2">CSV Lens</h1>
          <p className="text-sm text-neutral-500 mb-6">View, search, sort, and analyze CSV files. Data never leaves your browser.</p>
          <label className="cursor-pointer px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors inline-block">
            Open CSV File
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }} aria-label="Open CSV file" />
          </label>
          <p className="text-xs text-neutral-600 mt-3">or drop a file here</p>
          <div className="mt-4">
            <label className="text-xs text-neutral-500">Delimiter: </label>
            <select value={delimiter} onChange={(e) => setDelimiter(e.target.value)} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-neutral-300 outline-none">
              <option value="auto">Auto-detect</option>
              <option value=",">Comma (,)</option>
              <option value="	">Tab (\t)</option>
              <option value=";">Semicolon (;)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  let rows = [...parsed.rows]
  if (search) {
    rows = rows.filter((r) => r.some((c) => c.toLowerCase().includes(search.toLowerCase())))
  }
  if (sortCol !== null) {
    rows.sort((a, b) => {
      const av = a[sortCol] ?? ''; const bv = b[sortCol] ?? ''
      const an = Number(av); const bn = Number(bv)
      const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : av.localeCompare(bv)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }

  const colStats = selectedCol !== null ? getColumnStats(parsed.rows, selectedCol) : null

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-100 flex flex-col">
      <header className="px-6 py-3 border-b border-[#1e1e1e] flex items-center gap-4 flex-wrap shrink-0">
        <div>
          <h1 className="font-bold text-neutral-200">{filename}</h1>
          <p className="text-xs text-neutral-500">{parsed.rows.length.toLocaleString()} rows · {parsed.headers.length} columns</p>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="bg-[#1a1a1a] border border-[#2e2e2e] rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 text-neutral-200 w-48"
            aria-label="Search"
          />
          <span className="text-xs text-neutral-600">{rows.length} / {parsed.rows.length} rows</span>
          <button onClick={() => { setParsed(null); setFilename('') }} className="text-xs px-3 py-1.5 border border-[#2e2e2e] hover:border-[#444] rounded text-neutral-500 hover:text-neutral-200 transition-colors">
            New file
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="text-xs border-collapse min-w-full">
            <thead className="sticky top-0 bg-[#111] z-10">
              <tr>
                <th className="px-3 py-2 text-left text-neutral-600 border-b border-[#1e1e1e] w-12">#</th>
                {parsed.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left text-neutral-400 border-b border-[#1e1e1e] whitespace-nowrap cursor-pointer hover:text-neutral-200 select-none"
                    onClick={() => { handleSort(i); setSelectedCol(i) }}
                    aria-sort={sortCol === i ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {h} {sortCol === i ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 1000).map((row, ri) => (
                <tr key={ri} className="hover:bg-[#1a1a1a] border-b border-[#111] transition-colors">
                  <td className="px-3 py-1.5 text-neutral-700 tabular-nums">{ri + 1}</td>
                  {parsed.headers.map((_, ci) => (
                    <td key={ci} className="px-3 py-1.5 text-neutral-300 max-w-[200px] truncate" title={row[ci] ?? ''}>
                      {row[ci] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 1000 && (
            <div className="text-center py-4 text-xs text-neutral-600">Showing first 1,000 of {rows.length} rows</div>
          )}
        </div>

        {/* Column stats */}
        {colStats && selectedCol !== null && (
          <aside className="w-60 shrink-0 border-l border-[#1e1e1e] bg-[#111] p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-semibold text-neutral-400">Column Stats</h2>
              <button onClick={() => setSelectedCol(null)} className="text-neutral-700 hover:text-neutral-300" aria-label="Close stats">×</button>
            </div>
            <div className="text-xs font-medium text-neutral-300 mb-3">{parsed.headers[selectedCol]}</div>
            {'avg' in colStats ? (
              <div className="space-y-2">
                {[
                  { label: 'Type', val: 'Numeric' },
                  { label: 'Count', val: colStats.count },
                  { label: 'Min', val: (colStats.min as number).toLocaleString() },
                  { label: 'Max', val: (colStats.max as number).toLocaleString() },
                  { label: 'Average', val: (colStats.avg as number).toFixed(2) },
                  { label: 'Median', val: (colStats.median as number).toFixed(2) },
                  { label: 'Sum', val: (colStats.sum as number).toLocaleString() },
                  { label: 'Empty', val: colStats.empty },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-neutral-600">{label}</span>
                    <span className="text-neutral-300 font-mono">{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { label: 'Type', val: 'Text' },
                  { label: 'Count', val: colStats.count },
                  { label: 'Unique', val: colStats.unique },
                  { label: 'Empty', val: colStats.empty },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-neutral-600">{label}</span>
                    <span className="text-neutral-300 font-mono">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
