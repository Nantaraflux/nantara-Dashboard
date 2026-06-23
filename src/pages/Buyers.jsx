import React, { useState, useMemo } from 'react'
import { useAirtable } from '../hooks/useAirtable'
import { useToast } from '../components/ui/Toast'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { format, parseISO, differenceInDays } from 'date-fns'

export default function Buyers() {
  const { data: buyers, loading, update, create } = useAirtable('Buyers')
  const { data: orders } = useAirtable('Orders', {}, 60000)
  const { data: chats } = useAirtable('Chats', {}, 60000)
  const toast = useToast()
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState('orders')
  const [filters, setFilters] = useState({ stage: '', churnOnly: false, search: '' })
  const [newBuyer, setNewBuyer] = useState({ name: '', phone: '', company: '', pipeline_stage: 'prospect' })

  const filtered = useMemo(() => {
    let list = buyers
    if (filters.stage) list = list.filter(b => b.pipeline_stage === filters.stage)
    if (filters.churnOnly) list = list.filter(b => b.churn_risk)
    if (filters.search) {
      const s = filters.search.toLowerCase()
      list = list.filter(b => (b.name || '').toLowerCase().includes(s) || (b.phone || '').includes(s))
    }
    return list
  }, [buyers, filters])

  const fmtRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`
  const fmtDate = (d) => {
    if (!d) return '—'
    try { return format(parseISO(d), 'dd MMM yyyy') } catch { return d }
  }

  const buyerOrders = selected ? orders.filter(o => o.buyer_id === (selected.buyer_id || selected.id)) : []
  const buyerChats = selected ? chats.filter(c => c.buyer_id === (selected.buyer_id || selected.id)) : []

  const handleStageChange = async (id, stage) => {
    try {
      await update(id, { pipeline_stage: stage })
      if (selected?.id === id) setSelected(prev => ({ ...prev, pipeline_stage: stage }))
      toast.success('Stage updated')
    } catch (err) {
      toast.error('Update failed: ' + err.message)
    }
  }

  const handleChurnToggle = async (id, current) => {
    try {
      await update(id, { churn_risk: !current })
      if (selected?.id === id) setSelected(prev => ({ ...prev, churn_risk: !current }))
      toast.success(current ? 'Churn risk cleared' : 'Flagged as churn risk')
    } catch (err) {
      toast.error('Update failed: ' + err.message)
    }
  }

  const handleAddBuyer = async () => {
    if (!newBuyer.name.trim()) { toast.error('Name is required'); return }
    try {
      await create(newBuyer)
      setShowAdd(false)
      setNewBuyer({ name: '', phone: '', company: '', pipeline_stage: 'prospect' })
      toast.success('Buyer created')
    } catch (err) {
      toast.error('Failed to create: ' + err.message)
    }
  }

  const columns = [
    { key: 'name', label: 'Name', render: (v) => <span className="font-medium">{v || '—'}</span> },
    { key: 'company', label: 'Company' },
    { key: 'phone', label: 'Phone' },
    { key: 'pipeline_stage', label: 'Stage', render: (v) => <Badge>{v || 'prospect'}</Badge> },
    { key: 'total_orders', label: 'Orders', render: (v) => v || 0 },
    { key: 'total_spend', label: 'Total Spend', render: (v) => fmtRp(v) },
    { key: 'last_order', label: 'Last Order', render: (v) => fmtDate(v) },
    { key: 'churn_risk', label: 'Churn', render: (v) => v ? <Badge variant="danger">Risk</Badge> : <span className="text-txt-tertiary">—</span> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search name or phone..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="bg-bg-elevated border border-border rounded-md px-3 py-1.5 text-[13px] text-txt-primary placeholder:text-txt-tertiary outline-none focus:border-accent-primary w-56"
        />
        <select
          value={filters.stage}
          onChange={e => setFilters(f => ({ ...f, stage: e.target.value }))}
          className="bg-bg-elevated border border-border rounded-md px-3 py-1.5 text-[13px] text-txt-primary outline-none"
        >
          <option value="">All Stages</option>
          {['prospect', 'lead', 'active', 'vip', 'churned'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[13px] text-txt-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={filters.churnOnly}
            onChange={e => setFilters(f => ({ ...f, churnOnly: e.target.checked }))}
            className="rounded"
          />
          Churn risk only
        </label>
        <div className="flex-1" />
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 text-[12px] font-medium bg-accent-primary text-white rounded-md hover:bg-accent-secondary transition-colors"
        >
          Add Buyer
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        onRowClick={row => { setSelected(row); setTab('orders') }}
        emptyMessage="No buyers found"
        emptyAction={<button onClick={() => setShowAdd(true)} className="px-3 py-1.5 text-[12px] font-medium bg-accent-primary text-white rounded-md">Add first buyer</button>}
      />

      {/* Buyer Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || 'Buyer'} width="max-w-3xl">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-accent-secondary text-lg font-semibold">
                  {(selected.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-[15px] text-txt-primary font-semibold">{selected.name}</div>
                <div className="text-[13px] text-txt-secondary">{selected.company || ''} · {selected.phone || ''}</div>
                <div className="flex gap-2 mt-1">
                  <Badge>{selected.pipeline_stage || 'prospect'}</Badge>
                  {selected.churn_risk && <Badge variant="danger">Churn Risk</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total Orders', value: selected.total_orders || 0 },
                { label: 'Total Spend', value: fmtRp(selected.total_spend) },
                { label: 'Avg Order', value: fmtRp(selected.avg_order_value) },
                { label: 'Days Since Order', value: selected.last_order ? differenceInDays(new Date(), parseISO(selected.last_order)) : '—' },
              ].map(s => (
                <div key={s.label} className="bg-bg-elevated rounded p-3 text-center">
                  <div className="text-[11px] text-txt-tertiary">{s.label}</div>
                  <div className="text-[14px] text-txt-primary font-semibold mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {['orders', 'chats', 'notes'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded capitalize ${tab === t ? 'bg-accent-primary text-white' : 'text-txt-secondary hover:text-txt-primary bg-bg-elevated'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === 'orders' && (
              <div className="max-h-[300px] overflow-y-auto">
                {buyerOrders.length === 0 ? (
                  <div className="text-[13px] text-txt-tertiary text-center py-4">No orders</div>
                ) : buyerOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <div className="text-[13px] text-txt-primary">{o.order_id || o.id?.slice(-6)}</div>
                      <div className="text-[11px] text-txt-tertiary">{fmtDate(o.date)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] text-txt-primary font-medium">{fmtRp(o.total)}</div>
                      <Badge>{o.status || 'pending'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'chats' && (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {buyerChats.length === 0 ? (
                  <div className="text-[13px] text-txt-tertiary text-center py-4">No chat history</div>
                ) : buyerChats
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map(c => (
                  <div key={c.id} className="flex gap-3 py-2 border-b border-border last:border-0">
                    <Badge>{c.sender || 'unknown'}</Badge>
                    <div className="flex-1 text-[13px] text-txt-secondary truncate">{c.message}</div>
                    <span className="text-[11px] text-txt-tertiary whitespace-nowrap">{fmtDate(c.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'notes' && (
              <div className="text-[13px] text-txt-secondary whitespace-pre-wrap min-h-[100px]">
                {selected.notes || 'No notes'}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-border">
              {selected.phone && (
                <a
                  href={`https://wa.me/${selected.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-[12px] font-medium bg-success/15 text-success rounded-md hover:bg-success/25"
                >
                  WhatsApp
                </a>
              )}
              <select
                value={selected.pipeline_stage || 'prospect'}
                onChange={e => handleStageChange(selected.id, e.target.value)}
                className="bg-bg-elevated border border-border rounded-md px-2 py-1.5 text-[12px] text-txt-primary outline-none"
              >
                {['prospect', 'lead', 'active', 'vip', 'churned'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={() => handleChurnToggle(selected.id, selected.churn_risk)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-md ${selected.churn_risk ? 'bg-danger/15 text-danger' : 'bg-bg-elevated border border-border text-txt-secondary'}`}
              >
                {selected.churn_risk ? 'Clear Churn Risk' : 'Flag Churn Risk'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Buyer Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Buyer" width="max-w-md">
        <div className="space-y-3">
          {[
            { key: 'name', label: 'Name', placeholder: 'Full name', required: true },
            { key: 'phone', label: 'Phone (WA)', placeholder: '628xxx' },
            { key: 'company', label: 'Company', placeholder: 'Company name' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[12px] text-txt-secondary block mb-1">{f.label}{f.required && ' *'}</label>
              <input
                type="text"
                value={newBuyer[f.key]}
                onChange={e => setNewBuyer(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-[13px] text-txt-primary placeholder:text-txt-tertiary outline-none focus:border-accent-primary"
              />
            </div>
          ))}
          <div>
            <label className="text-[12px] text-txt-secondary block mb-1">Stage</label>
            <select
              value={newBuyer.pipeline_stage}
              onChange={e => setNewBuyer(prev => ({ ...prev, pipeline_stage: e.target.value }))}
              className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-[13px] text-txt-primary outline-none"
            >
              {['prospect', 'lead', 'active', 'vip'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddBuyer}
            className="w-full px-3 py-2 bg-accent-primary text-white text-[13px] font-medium rounded-md hover:bg-accent-secondary transition-colors"
          >
            Add Buyer
          </button>
        </div>
      </Modal>
    </div>
  )
}
