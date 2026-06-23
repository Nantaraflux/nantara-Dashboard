import React, { useState, useMemo } from 'react'
import { useAirtable } from '../hooks/useAirtable'
import { sendWhatsApp } from '../config/n8n'
import { useToast } from '../components/ui/Toast'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { format, parseISO, isToday, isBefore, startOfDay, endOfWeek } from 'date-fns'

export default function Followups() {
  const { data: followups, loading, update } = useAirtable('Followups')
  const { data: buyers } = useAirtable('Buyers', {}, 60000)
  const toast = useToast()
  const [tab, setTab] = useState('today')
  const [preview, setPreview] = useState(null)
  const [reschedule, setReschedule] = useState(null)
  const [newDate, setNewDate] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())

  const buyerMap = useMemo(() => {
    const map = {}
    buyers.forEach(b => { map[b.buyer_id || b.id] = b })
    return map
  }, [buyers])

  const now = startOfDay(new Date())
  const weekEnd = endOfWeek(new Date())

  const filtered = useMemo(() => {
    let list = followups
    switch (tab) {
      case 'today':
        list = list.filter(f => { try { return isToday(parseISO(f.scheduled_date)) } catch { return false } })
        break
      case 'week':
        list = list.filter(f => { try { const d = parseISO(f.scheduled_date); return d >= now && d <= weekEnd } catch { return false } })
        break
      case 'overdue':
        list = list.filter(f => { try { return f.status === 'pending' && isBefore(parseISO(f.scheduled_date), now) } catch { return false } })
        break
      default:
        break
    }
    return list.sort((a, b) => new Date(a.scheduled_date || 0) - new Date(b.scheduled_date || 0))
  }, [followups, tab, now, weekEnd])

  const fmtDate = (d) => {
    if (!d) return '—'
    try { return format(parseISO(d), 'dd MMM yyyy') } catch { return d }
  }

  const handleSend = async (followup) => {
    const buyer = buyerMap[followup.buyer_id]
    if (!buyer?.phone) { toast.error('No phone number for this buyer'); return }
    try {
      await sendWhatsApp(buyer.phone, followup.message_template || '')
      await update(followup.id, { status: 'sent' })
      toast.success('Message sent via WhatsApp')
    } catch (err) {
      toast.error('Send failed: ' + err.message)
    }
  }

  const handleMarkDone = async (id) => {
    try {
      await update(id, { status: 'done' })
      toast.success('Marked as done')
    } catch (err) {
      toast.error('Update failed: ' + err.message)
    }
  }

  const handleSkip = async (id) => {
    try {
      await update(id, { status: 'skipped' })
      toast.success('Skipped')
    } catch (err) {
      toast.error('Update failed: ' + err.message)
    }
  }

  const handleReschedule = async () => {
    if (!newDate || !reschedule) return
    try {
      await update(reschedule.id, { scheduled_date: newDate })
      setReschedule(null)
      setNewDate('')
      toast.success('Rescheduled')
    } catch (err) {
      toast.error('Reschedule failed: ' + err.message)
    }
  }

  const handleBulkSend = async () => {
    const toSend = filtered.filter(f => selectedIds.has(f.id) && f.status === 'pending')
    let sent = 0
    for (const f of toSend) {
      try {
        await handleSend(f)
        sent++
      } catch {}
    }
    setSelectedIds(new Set())
    toast.success(`Sent ${sent} of ${toSend.length} messages`)
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const overdueCount = followups.filter(f => {
    try { return f.status === 'pending' && isBefore(parseISO(f.scheduled_date), now) } catch { return false }
  }).length

  const columns = [
    {
      key: '_select', label: '', width: '40px', sortable: false,
      render: (_, row) => (
        <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)} className="rounded" onClick={e => e.stopPropagation()} />
      ),
    },
    { key: 'buyer_id', label: 'Buyer', render: (v) => <span className="font-medium">{buyerMap[v]?.name || v || '—'}</span> },
    { key: 'type', label: 'Type', render: (v) => <Badge>{v || 'whatsapp'}</Badge> },
    { key: 'scheduled_date', label: 'Scheduled', render: (v) => fmtDate(v) },
    { key: 'message_template', label: 'Message', render: (v) => <span className="truncate block max-w-[200px]">{v || '—'}</span> },
    { key: 'status', label: 'Status', render: (v) => <Badge>{v || 'pending'}</Badge> },
    { key: 'result', label: 'Result', render: (v) => v ? <Badge>{v}</Badge> : <span className="text-txt-tertiary">—</span> },
    {
      key: '_actions', label: 'Actions', width: '200px', sortable: false,
      render: (_, row) => (
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          {row.status === 'pending' && (
            <>
              <button onClick={() => handleSend(row)} className="px-2 py-1 text-[11px] bg-accent-primary text-white rounded hover:bg-accent-secondary">Send</button>
              <button onClick={() => handleMarkDone(row.id)} className="px-2 py-1 text-[11px] bg-bg-surface border border-border text-txt-secondary rounded hover:text-txt-primary">Done</button>
              <button onClick={() => handleSkip(row.id)} className="px-2 py-1 text-[11px] bg-bg-surface border border-border text-txt-secondary rounded hover:text-txt-primary">Skip</button>
              <button onClick={() => { setReschedule(row); setNewDate(row.scheduled_date || '') }} className="px-2 py-1 text-[11px] bg-bg-surface border border-border text-txt-secondary rounded hover:text-txt-primary">📅</button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {[
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'overdue', label: `Overdue${overdueCount > 0 ? ` (${overdueCount})` : ''}` },
          { key: 'all', label: 'All' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1.5 text-[12px] font-medium rounded-md ${tab === t.key ? 'bg-accent-primary text-white' : 'bg-bg-elevated border border-border text-txt-secondary hover:text-txt-primary'}`}>
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        {selectedIds.size > 0 && (
          <button onClick={handleBulkSend} className="px-3 py-1.5 text-[12px] font-medium bg-accent-primary text-white rounded-md hover:bg-accent-secondary">
            Send Selected ({selectedIds.size})
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        onRowClick={setPreview}
        emptyMessage={tab === 'overdue' ? 'No overdue follow-ups' : 'No follow-ups scheduled'}
      />

      {/* Preview Modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Follow-up Details">
        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><div className="text-[11px] text-txt-tertiary uppercase">Buyer</div><div className="text-[14px] text-txt-primary">{buyerMap[preview.buyer_id]?.name || preview.buyer_id}</div></div>
              <div><div className="text-[11px] text-txt-tertiary uppercase">Type</div><Badge>{preview.type || 'whatsapp'}</Badge></div>
              <div><div className="text-[11px] text-txt-tertiary uppercase">Scheduled</div><div className="text-[14px] text-txt-primary">{fmtDate(preview.scheduled_date)}</div></div>
              <div><div className="text-[11px] text-txt-tertiary uppercase">Status</div><Badge>{preview.status || 'pending'}</Badge></div>
            </div>
            <div>
              <div className="text-[11px] text-txt-tertiary uppercase mb-1">Message</div>
              <div className="bg-bg-primary border border-border rounded p-3 text-[13px] text-txt-secondary whitespace-pre-wrap">{preview.message_template || 'No message template'}</div>
            </div>
            <div><div className="text-[11px] text-txt-tertiary uppercase">Created by</div><div className="text-[13px] text-txt-secondary">{preview.created_by || 'manual'}</div></div>
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal open={!!reschedule} onClose={() => setReschedule(null)} title="Reschedule" width="max-w-sm">
        <div className="space-y-3">
          <label className="text-[12px] text-txt-secondary block">New Date</label>
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-[13px] text-txt-primary outline-none focus:border-accent-primary" />
          <button onClick={handleReschedule} className="w-full px-3 py-2 bg-accent-primary text-white text-[13px] font-medium rounded-md hover:bg-accent-secondary">Reschedule</button>
        </div>
      </Modal>
    </div>
  )
}
