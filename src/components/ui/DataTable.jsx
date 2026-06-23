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
      <div className="border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="bg-bg-elevated">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 border-b border-border last:border-0 flex items-center px-6 gap-4 animate-pulse">
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
      <div className="border border-border rounded-xl p-12 text-center bg-bg-surface shadow-sm">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" className="mx-auto mb-3 opacity-60">
          <path d="M20 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
          <path d="M16 3v4" />
          <path d="M8 3v4" />
          <path d="M4 11h16" />
        </svg>
        <div className="text-txt-secondary text-[13px] font-medium mb-3">{emptyMessage}</div>
        {emptyAction}
      </div>
    )
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-border">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="text-left text-label text-txt-secondary px-6 py-3.5 font-semibold cursor-pointer hover:text-txt-primary select-none whitespace-nowrap transition-colors"
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortCol === col.key && (
                      <span className="text-accent-primary font-bold">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={row.id || i}
                className={`border-b border-border last:border-0 h-12 ${
                  onRowClick ? 'cursor-pointer hover:bg-blue-50/50 transition-colors' : ''
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-6 py-3 text-[13px] text-txt-primary whitespace-nowrap font-medium">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-bg-elevated">
          <span className="text-[12px] text-txt-secondary font-medium">
            {sorted.length} records · Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-[12px] font-medium rounded-lg bg-bg-surface border border-border text-txt-secondary hover:text-txt-primary hover:border-accent-light disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-[12px] font-medium rounded-lg bg-bg-surface border border-border text-txt-secondary hover:text-txt-primary hover:border-accent-light disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
