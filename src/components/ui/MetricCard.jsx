import React from 'react'

export default function MetricCard({ label, value, delta, prefix = '', icon, loading }) {
  if (loading) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl p-5 animate-pulse shadow-sm">
        <div className="flex justify-between mb-3">
          <div className="h-4 w-24 bg-bg-elevated rounded" />
          <div className="w-8 h-8 bg-bg-elevated rounded-lg" />
        </div>
        <div className="h-8 w-32 bg-bg-elevated rounded mb-2" />
        <div className="h-3 w-20 bg-bg-elevated rounded" />
      </div>
    )
  }

  const isPositive = delta > 0
  const isNegative = delta < 0

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-5 hover:shadow-lg hover:border-accent-light transition-all duration-300 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="text-label text-txt-secondary uppercase tracking-wider">{label}</div>
        {icon && (
          <div className="w-8 h-8 rounded-lg gradient-accent-light flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <div className="text-metric text-txt-primary font-bold mb-2">
        {prefix}{typeof value === 'number' ? value.toLocaleString('id-ID') : value}
      </div>
      {delta !== undefined && (
        <div className={`text-[12px] font-semibold flex items-center gap-1 ${isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-txt-tertiary'}`}>
          <span>{isPositive ? '↑' : isNegative ? '↓' : '→'}</span>
          <span>{Math.abs(delta).toFixed(1)}% vs yesterday</span>
        </div>
      )}
    </div>
  )
}
