import React, { useState, useMemo } from 'react'

export default function DataTable({
  columns,
  data,
  loading,
  onRowClick,
  pageSize = 25,
  emptyMessage = 'No data found',
  emptyAction,
}) {
  const [page, setPage] = useState(0)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const sorted = useMemo(() => {
    if (!sortCol) return data
    return [...data].sort((a, b) => {
      const av = a[sortCol]
      const bv = b[sortCol]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortCol, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key) => {
    if (sortCol === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(key)
      setSortDir('asc')
    }
  }

  if (loading) {
    return (
      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-bg-elevated">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 border-b border-border flex items-center px-4 gap-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-3 bg-bg-surface rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="border border-border rounded-md p-8 text-center">
        <div className="text-txt-tertiary text-[13px] mb-3">{emptyMessage}</div>
        {emptyAction}
      </div>
    )
  }

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-surface border-b border-border">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="text-left text-label text-txt-secondary px-4 h-10 font-medium cursor-pointer hover:text-txt-primary select-none whitespace-nowrap"
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  {col.label}
                  {sortCol === col.key && (
                    <span className="ml-1 text-accent-secondary">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={row.id || i}
                className={`h-10 border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-bg-elevated' : 'bg-bg-elevated/50'} ${onRowClick ? 'cursor-pointer hover:bg-bg-surface' : ''} transition-colors`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 text-[13px] text-txt-primary whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-bg-surface">
          <span className="text-[12px] text-txt-tertiary">
            {sorted.length} records · Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 text-[12px] rounded bg-bg-elevated text-txt-secondary hover:text-txt-primary disabled:opacity-30 disabled:cursor-not-allowed border border-border"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1 text-[12px] rounded bg-bg-elevated text-txt-secondary hover:text-txt-primary disabled:opacity-30 disabled:cursor-not-allowed border border-border"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
