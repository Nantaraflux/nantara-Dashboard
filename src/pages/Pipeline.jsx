import React, { useState, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useAirtable } from '../hooks/useAirtable'
import { useToast } from '../components/ui/Toast'
import Badge from '../components/ui/Badge'
import FunnelChart from '../components/charts/FunnelChart'

const STAGES = ['awareness', 'interest', 'decision', 'won', 'lost']

export default function Pipeline() {
  const { data: pipeline, loading, update } = useAirtable('Pipeline')
  const { data: buyers } = useAirtable('Buyers', {}, 60000)
  const toast = useToast()
  const [showFunnel, setShowFunnel] = useState(true)

  const buyerMap = useMemo(() => {
    const map = {}
    buyers.forEach(b => { map[b.buyer_id || b.id] = b })
    return map
  }, [buyers])

  const columns = useMemo(() => {
    const cols = {}
    STAGES.forEach(s => { cols[s] = [] })
    pipeline.forEach(deal => {
      const stage = (deal.stage || 'awareness').toLowerCase()
      if (cols[stage]) cols[stage].push(deal)
      else cols.awareness.push(deal)
    })
    return cols
  }, [pipeline])

  const fmtRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`

  const handleDragEnd = async (result) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStage = destination.droppableId

    try {
      await update(draggableId, { stage: newStage })
      toast.success(`Moved to ${newStage}`)
    } catch (err) {
      toast.error('Failed to move: ' + err.message)
    }
  }

  const totalPipelineValue = pipeline
    .filter(d => !['won', 'lost'].includes(d.stage?.toLowerCase()))
    .reduce((s, d) => s + (d.expected_value || 0), 0)

  const wonDeals = pipeline.filter(d => d.stage?.toLowerCase() === 'won').length
  const totalDeals = pipeline.filter(d => d.stage?.toLowerCase() !== 'lost').length
  const winRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) : 0

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          {STAGES.map(s => (
            <div key={s} className="flex-1 bg-bg-elevated border border-border rounded-md p-3 animate-pulse">
              <div className="h-4 w-20 bg-bg-surface rounded mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-bg-surface rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-bg-elevated border border-border rounded-md px-3 py-2">
          <div className="text-[11px] text-txt-tertiary">Pipeline Value</div>
          <div className="text-[15px] text-txt-primary font-semibold">{fmtRp(totalPipelineValue)}</div>
        </div>
        <div className="bg-bg-elevated border border-border rounded-md px-3 py-2">
          <div className="text-[11px] text-txt-tertiary">Win Rate</div>
          <div className="text-[15px] text-txt-primary font-semibold">{winRate}%</div>
        </div>
        <div className="bg-bg-elevated border border-border rounded-md px-3 py-2">
          <div className="text-[11px] text-txt-tertiary">Active Deals</div>
          <div className="text-[15px] text-txt-primary font-semibold">{pipeline.length}</div>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowFunnel(v => !v)}
          className="px-3 py-1.5 text-[12px] font-medium bg-bg-elevated border border-border text-txt-secondary rounded-md hover:text-txt-primary"
        >
          {showFunnel ? 'Hide' : 'Show'} Funnel
        </button>
      </div>

      <div className="flex gap-4">
        <div className={`flex-1 flex gap-3 overflow-x-auto pb-2 ${showFunnel ? '' : ''}`}>
          <DragDropContext onDragEnd={handleDragEnd}>
            {STAGES.map(stage => {
              const deals = columns[stage] || []
              const stageValue = deals.reduce((s, d) => s + (d.expected_value || 0), 0)
              return (
                <Droppable key={stage} droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-w-[200px] bg-bg-surface border border-border rounded-md flex flex-col ${snapshot.isDraggingOver ? 'border-accent-primary/50' : ''}`}
                    >
                      <div className="px-3 py-2.5 border-b border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] text-txt-primary font-medium capitalize">{stage}</span>
                          <span className="text-[11px] text-txt-tertiary bg-bg-elevated px-1.5 py-0.5 rounded">{deals.length}</span>
                        </div>
                        <div className="text-[11px] text-txt-tertiary mt-0.5">{fmtRp(stageValue)}</div>
                      </div>
                      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                        {deals.map((deal, index) => {
                          const buyer = buyerMap[deal.buyer_id]
                          return (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-bg-elevated border border-border rounded p-3 ${snapshot.isDragging ? 'shadow-lg border-accent-primary' : ''}`}
                                >
                                  <div className="text-[13px] text-txt-primary font-medium">{buyer?.name || deal.buyer_id || '—'}</div>
                                  <div className="text-[11px] text-txt-tertiary">{buyer?.company || ''}</div>
                                  <div className="text-[13px] text-txt-primary font-semibold mt-1">{fmtRp(deal.expected_value)}</div>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] text-txt-tertiary">{deal.days_in_stage || 0}d in stage</span>
                                    <Badge>{deal.probability || 0}%</Badge>
                                  </div>
                                  {deal.next_action && (
                                    <div className="text-[11px] text-txt-secondary mt-1.5 truncate">→ {deal.next_action}</div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                        {deals.length === 0 && (
                          <div className="text-center text-[12px] text-txt-tertiary py-6">No deals</div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              )
            })}
          </DragDropContext>
        </div>

        {showFunnel && (
          <div className="w-[220px] flex-shrink-0">
            <FunnelChart data={pipeline} />
          </div>
        )}
      </div>
    </div>
  )
}
