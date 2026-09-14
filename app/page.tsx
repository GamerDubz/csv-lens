'use client'

import { useState, useCallback, useRef, useMemo } from 'react'

type ParsedCSV = {
  headers: string[]
  rows: string[][]
}

const SAMPLE_DATASET = `ID,Customer_Name,Company,Plan_Tier,Monthly_Spend,Country,Sign_Up_Date,Churn_Risk,Satisfaction_Score
101,Elena Rostova,Skyline AI,Enterprise,4250,United Kingdom,2024-01-15,Low,9.4
102,Marcus Vance,Apex Cloud,Growth,1800,United States,2024-02-02,Medium,8.1
103,Chloe Dubois,Nexus Labs,Enterprise,5500,France,2023-11-20,Low,9.8
104,Kenji Takahashi,Zenith Interactive,Starter,450,Japan,2024-03-10,High,6.2
105,Sarah Jenkins,Orbit Commerce,Growth,2100,United States,2024-01-28,Low,9.0
106,Liam O'Connor,Beacon Health,Enterprise,6800,Ireland,2023-10-05,Low,9.9
107,Ananya Sharma,Prism Robotics,Growth,1950,India,2024-02-18,Medium,7.8
108,Lukas Weber,Kinetics GmbH,Starter,600,Germany,2024-04-01,High,5.9
109,Mia Chen,Vivid Media,Enterprise,4900,Singapore,2023-12-12,Low,9.2
110,Mateo Rossi,Solaria Design,Growth,2200,Italy,2024-01-09,Low,8.7
111,Jessica Taylor,Quantum Retail,Starter,350,Canada,2024-04-14,High,6.5
112,David Kim,AeroDynamics,Growth,1750,South Korea,2024-02-22,Medium,7.5
113,Sofia Martinez,Lumina Financial,Enterprise,7200,Spain,2023-09-30,Low,9.7
114,Frederik Lind,Nordic Stream,Starter,500,Sweden,2024-03-27,Medium,7.1
115,Tariq Al-Mansoor,Falcon Ventures,Enterprise,8400,UAE,2023-08-14,Low,10.0`

function parseCSV(text: string, userDelimiter = 'auto'): { data: ParsedCSV; detectedDelimiter: string } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return { data: { headers: [], rows: [] }, detectedDelimiter: ',' }

  let delimiter = userDelimiter
  if (delimiter === 'auto') {
    const firstLine = lines[0]
    const candidates = [',', '\t', ';', '|']
    delimiter = candidates.reduce((best, d) => {
      return firstLine.split(d).length > firstLine.split(best).length ? d : best
    }, ',')
  }

  const parseRow = (line: string): string[] => {
    const cells: string[] = []
    let inQuotes = false
    let cell = ''
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes
      } else if (line[i] === delimiter && !inQuotes) {
        cells.push(cell.trim())
        cell = ''
      } else {
        cell += line[i]
      }
    }
    cells.push(cell.trim())
    return cells
  }

  const headers = parseRow(lines[0])
  const rows = lines.slice(1).map(parseRow).filter((r) => r.some((c) => c !== ''))
  return { data: { headers, rows }, detectedDelimiter: delimiter }
}

function getColumnStats(rows: string[][], colIdx: number) {
  const vals = rows.map((r) => r[colIdx] ?? '').filter((v) => v !== '')
  const nums = vals.map(Number).filter((n) => !isNaN(n))
  const isNumeric = nums.length > vals.length * 0.75 && nums.length > 0

  const total = rows.length
  const empty = total - vals.length
  const completeness = total > 0 ? Math.round(((total - empty) / total) * 100) : 100

  if (!isNumeric) {
    const freqMap: Record<string, number> = {}
    vals.forEach((v) => {
      freqMap[v] = (freqMap[v] || 0) + 1
    })
    const sortedFreq = Object.entries(freqMap).sort((a, b) => b[1] - a[1])
    return {
      type: 'text',
      count: vals.length,
      unique: Object.keys(freqMap).length,
      empty,
      completeness,
      topValues: sortedFreq.slice(0, 5),
    }
  }

  const sum = nums.reduce((a, b) => a + b, 0)
  const sorted = [...nums].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const avg = sum / nums.length

  return {
    type: 'numeric',
    count: nums.length,
    min,
    max,
    avg,
    median,
    sum,
    empty,
    completeness,
    unique: new Set(nums).size,
  }
}

export default function CSVLensPage() {
  const [rawText, setRawText] = useState(SAMPLE_DATASET)
  const [filename, setFilename] = useState('saas_customers_demo.csv')
  const [delimiter, setDelimiter] = useState('auto')
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [inspectCol, setInspectCol] = useState<number | null>(4) // Default inspect Monthly_Spend
  const [pageSize, setPageSize] = useState(25)
  const [pageIndex, setPageIndex] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: parsed, detectedDelimiter } = useMemo(() => {
    return parseCSV(rawText, delimiter)
  }, [rawText, delimiter])

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (text) {
        setRawText(text)
        setFilename(file.name)
        setSortCol(null)
        setInspectCol(null)
        setPageIndex(0)
      }
    }
    reader.readAsText(file)
  }, [])

  // Filter and sort rows
  const filteredRows = useMemo(() => {
    let list = parsed.rows
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) => r.some((c) => c.toLowerCase().includes(q)))
    }
    if (sortCol !== null && parsed.headers[sortCol] !== undefined) {
      list = [...list].sort((a, b) => {
        const valA = a[sortCol] ?? ''
        const valB = b[sortCol] ?? ''
        const numA = Number(valA)
        const numB = Number(valB)
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDir === 'asc' ? numA - numB : numB - numA
        }
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      })
    }
    return list
  }, [parsed.rows, parsed.headers, search, sortCol, sortDir])

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
  }, [filteredRows, pageIndex, pageSize])

  const toggleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      if (sortDir === 'asc') setSortDir('desc')
      else {
        setSortCol(null)
        setSortDir('asc')
      }
    } else {
      setSortCol(colIdx)
      setSortDir('asc')
    }
  }

  // Summary Metrics
  const totalCells = parsed.rows.length * parsed.headers.length
  const emptyCells = useMemo(() => {
    let count = 0
    parsed.rows.forEach((r) => {
      r.forEach((c) => {
        if (!c || c.trim() === '') count++
      })
    })
    return count
  }, [parsed.rows])

  const completenessScore = totalCells > 0 ? Math.round(((totalCells - emptyCells) / totalCells) * 100) : 100

  // Export handlers
  const exportCSV = () => {
    const content = [
      parsed.headers.join(','),
      ...filteredRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `filtered-${filename}`
    a.click()
  }

  const exportJSON = () => {
    const list = filteredRows.map((r) => {
      const obj: Record<string, string> = {}
      parsed.headers.forEach((h, i) => {
        obj[h] = r[i] ?? ''
      })
      return obj
    })
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename.replace(/\.[^/.]+$/, '')}.json`
    a.click()
  }

  const inspectedStats = inspectCol !== null && inspectCol < parsed.headers.length
    ? getColumnStats(parsed.rows, inspectCol)
    : null

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-700 p-0.5 shadow-sm shadow-teal-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3h18v18H3z" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900">
                  CSV <span className="text-teal-600">Lens</span>
                </h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Data Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                In-browser data table explorer, statistical profiler, and format converter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.tsv,.txt"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>📂 Open CSV File</span>
            </button>

            <button
              onClick={() => {
                setRawText(SAMPLE_DATASET)
                setFilename('saas_customers_demo.csv')
                setSortCol(null)
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Reset Demo
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <button
              onClick={exportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all cursor-pointer"
            >
              Export CSV
            </button>
            <button
              onClick={exportJSON}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
            >
              Export JSON
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-8 flex-1 space-y-6">
        {/* KPI Metrics Dashboard Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Total Rows
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-slate-900">
                {parsed.rows.length.toLocaleString()}
              </span>
              {search && (
                <span className="text-xs font-medium text-teal-600">
                  ({filteredRows.length} filtered)
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Columns
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-slate-900">
                {parsed.headers.length}
              </span>
              <span className="text-xs text-slate-400">fields</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Data Health Rate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-emerald-600">
                {completenessScore}%
              </span>
              <span className="text-[11px] text-slate-400">
                ({emptyCells} missing)
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Active Delimiter
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-slate-800 font-mono">
                {detectedDelimiter === ',' ? 'Comma (,)' : detectedDelimiter === '\t' ? 'Tab (\\t)' : detectedDelimiter === ';' ? 'Semicolon (;)' : 'Pipe (|)'}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPageIndex(0)
                }}
                placeholder="Search values in any column..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPageIndex(0)
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none font-mono"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500">
              <span>Page {pageIndex + 1} of {Math.max(1, Math.ceil(filteredRows.length / pageSize))}</span>
              <button
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((p) => p - 1)}
                className="px-2 py-1 rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
              >
                ‹
              </button>
              <button
                disabled={(pageIndex + 1) * pageSize >= filteredRows.length}
                onClick={() => setPageIndex((p) => p + 1)}
                className="px-2 py-1 rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Data Table (8 cols) + Column Profiler (4 cols) */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Table Container */}
          <div className={`${inspectCol !== null ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden flex flex-col transition-all`}>
            <div className="overflow-x-auto max-h-[600px] relative">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-10 text-slate-400 font-mono">#</th>
                    {parsed.headers.map((h, idx) => {
                      const isSorted = sortCol === idx
                      const isInspected = inspectCol === idx
                      return (
                        <th
                          key={idx}
                          className={`py-3 px-4 select-none whitespace-nowrap cursor-pointer transition-colors hover:bg-slate-200/70 ${
                            isInspected ? 'bg-teal-50 text-teal-800' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span onClick={() => setInspectCol(idx)} className="font-bold">
                              {h}
                            </span>
                            <button
                              onClick={() => toggleSort(idx)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                              title="Sort column"
                            >
                              {isSorted ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                            </button>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={parsed.headers.length + 1} className="py-12 text-center text-slate-400">
                        No rows match your current search query.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-teal-50/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                          {pageIndex * pageSize + rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap ${
                              inspectCol === cIdx ? 'bg-teal-50/20 font-medium' : ''
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500 flex justify-between items-center">
              <span>Tip: Click any column header to inspect its distribution & statistical summary.</span>
              <span className="font-mono">{filteredRows.length} total rows</span>
            </div>
          </div>

          {/* Statistical Column Inspector Drawer (4 cols) */}
          {inspectCol !== null && inspectedStats && (
            <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-teal-200/80 shadow-md space-y-4 sticky top-24">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100/80 text-teal-800">
                      {inspectedStats.type === 'numeric' ? '123 Numeric Field' : 'Aa Text Field'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    {parsed.headers[inspectCol]}
                  </h3>
                  <p className="text-xs text-slate-500">Column Index {inspectCol + 1}</p>
                </div>
                <button
                  onClick={() => setInspectCol(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 text-sm cursor-pointer"
                  title="Close Inspector"
                >
                  ✕
                </button>
              </div>

              {/* Stats Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Completeness</span>
                  <span className="text-base font-bold font-mono text-slate-800 mt-0.5 block">
                    {inspectedStats.completeness}%
                  </span>
                  <span className="text-[10px] text-slate-400">{inspectedStats.empty} missing</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Unique Values</span>
                  <span className="text-base font-bold font-mono text-slate-800 mt-0.5 block">
                    {inspectedStats.unique}
                  </span>
                  <span className="text-[10px] text-slate-400">{inspectedStats.count} populated</span>
                </div>
              </div>

              {inspectedStats.type === 'numeric' ? (
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Minimum</span>
                    <span className="font-mono font-semibold text-slate-800">{inspectedStats.min?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Maximum</span>
                    <span className="font-mono font-semibold text-slate-800">{inspectedStats.max?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Mean Average</span>
                    <span className="font-mono font-semibold text-slate-800">{inspectedStats.avg?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Median (50th percentile)</span>
                    <span className="font-mono font-semibold text-slate-800">{inspectedStats.median?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Cumulative Sum</span>
                    <span className="font-mono font-bold text-teal-700">{inspectedStats.sum?.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Top Frequent Values
                  </span>
                  <div className="space-y-1.5">
                    {inspectedStats.topValues?.map(([val, freq]) => (
                      <div key={val} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl">
                        <span className="font-medium text-slate-800 truncate max-w-[150px]">{val}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-md font-semibold">
                            {freq}x
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {Math.round((freq / parsed.rows.length) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
