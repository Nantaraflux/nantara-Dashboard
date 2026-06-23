import React from 'react'

const stageColors = {
  awareness: '#3B82F6',
  interest: '#8B5CF6',
  decision: '#F59E0B',
  won: '#10B981',
  lost: '#EF4444',
}

export default function FunnelChart({ data }) {
  const stages = ['awareness', 'interest', 'decision', 'won', 'lost']
  const counts = stages.map(s => ({
    stage: s,
    count: data.filter(d => d.stage?.toLowerCase() === s).length,
  }))
  const max = Math.max(...counts.map(c => c.count), 1)

  return (
    <div className="bg-bg-elevated border border-border rounded-md p-4">
      <div className="text-label text-txt-secondary mb-3">Sales Funnel</div>
      <div className="space-y-2">
        {counts.map(({ stage, count }) => (
          <div key={stage} className="flex items-center gap-3">
            <div className="w-20 text-[11px] text-txt-secondary capitalize">{stage}</div>
            <div className="flex-1 h-5 bg-bg-surface rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{
                  width: `${(count / max) * 100}%`,
                  backgroundColor: stageColors[stage],
                  minWidth: count > 0 ? '24px' : '0',
                }}
              />
            </div>
            <div className="w-8 text-[12px] text-txt-primary text-right font-medium">{count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
