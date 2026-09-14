export type ParsedCSV = { headers: string[]; rows: string[][] }

export type NumericColumnStats = {
  type: 'numeric'
  count: number
  min: number
  max: number
  avg: number
  median: number
  sum: number
  empty: number
}

export type TextColumnStats = {
  type: 'text'
  count: number
  unique: number
  empty: number
}

export type ColumnStats = NumericColumnStats | TextColumnStats

export const DELIMITERS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: ',', label: 'Comma' },
  { value: '\t', label: 'Tab' },
  { value: ';', label: 'Semicolon' },
  { value: '|', label: 'Pipe' },
] as const

export type DelimiterValue = (typeof DELIMITERS)[number]['value']

export function parseCSV(text: string, delimiter: string = 'auto'): ParsedCSV {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return { headers: [], rows: [] }

  let resolvedDelimiter = delimiter
  if (delimiter === 'auto') {
    const firstLine = lines[0]
    const candidates = [',', '\t', ';', '|']
    resolvedDelimiter = candidates.reduce((best, d) =>
      firstLine.split(d).length > firstLine.split(best).length ? d : best
    , ',')
  }

  const parseRow = (line: string): string[] => {
    const cells: string[] = []
    let inQuotes = false
    let cell = ''
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === resolvedDelimiter && !inQuotes) {
        cells.push(cell)
        cell = ''
      } else {
        cell += char
      }
    }
    cells.push(cell)
    return cells
  }

  const headers = parseRow(lines[0])
  const rows = lines.slice(1).map(parseRow)
  return { headers, rows }
}

export function getColumnStats(rows: string[][], colIndex: number): ColumnStats {
  const values = rows.map((r) => r[colIndex] ?? '').filter(Boolean)
  const numbers = values.map(Number).filter((n) => !Number.isNaN(n))
  const isNumeric = numbers.length > values.length * 0.8 && numbers.length > 0

  if (!isNumeric) {
    return {
      type: 'text',
      count: values.length,
      unique: new Set(values).size,
      empty: rows.length - values.length,
    }
  }

  const sum = numbers.reduce((a, b) => a + b, 0)
  const sorted = [...numbers].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]

  return {
    type: 'numeric',
    count: numbers.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / numbers.length,
    median,
    sum,
    empty: rows.length - numbers.length,
  }
}

export function filterRows(rows: string[][], query: string): string[][] {
  if (!query) return rows
  const q = query.toLowerCase()
  return rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)))
}

export function sortRows(rows: string[][], colIndex: number, direction: 'asc' | 'desc'): string[][] {
  const sorted = [...rows].sort((a, b) => {
    const aVal = a[colIndex] ?? ''
    const bVal = b[colIndex] ?? ''
    const aNum = Number(aVal)
    const bNum = Number(bVal)
    const cmp = aVal !== '' && bVal !== '' && !Number.isNaN(aNum) && !Number.isNaN(bNum)
      ? aNum - bNum
      : aVal.localeCompare(bVal)
    return direction === 'asc' ? cmp : -cmp
  })
  return sorted
}
