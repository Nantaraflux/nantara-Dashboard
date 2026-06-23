import React from 'react'

export default function MetricCard({ label, value, delta, prefix = '', loading }) {
  if (loading) {
    return (
      <div className="bg-bg-elevated border border-border rounded-md p-4 animate-pulse">
        <div className="h-3 w-20 bg-bg-surface rounded mb-3" />
        <div className="h-7 w-28 bg-bg-surface rounded mb-2" />
        <div className="h-3 w-16 bg-bg-surface rounded" />
      </div>
    )
  }

  const isPositive = delta > 0
  const isNegative = delta < 0

  return (
    <div className="bg-bg-elevated border border-border rounded-md p-4">
      <div className="text-label text-txt-secondary mb-1">{label}</div>
      <div className="text-metric text-txt-primary">
        {prefix}{typeof value === 'number' ? value.toLocaleString('id-ID') : value}
      </div>
      {delta !== undefined && (
        <div className={`text-[12px] font-medium mt-1 ${isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-txt-tertiary'}`}>
          {isPositive ? '+' : ''}{delta.toFixed(1)}% vs yesterday
        </div>
      )}
    </div>
  )
}
