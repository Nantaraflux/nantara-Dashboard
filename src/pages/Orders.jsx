import React, { useState, useMemo } from 'react'
import { useAirtable } from '../hooks/useAirtable'
import { useToast } from '../components/ui/Toast'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { format, parseISO } from 'date-fns'

export default function Orders() {
  const { data: orders, loading, update } = useAirtable('Orders')
  const toast = useToast()
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({ status: '', payment: '', search: '' })

  const filtered = useMemo(() => {
    let list = orders
    if (filters.status) list = list.filter(o => o.status === filters.status)
    if (filters.payment) list = list.filter(o => o.payment_status === filters.payment)
    if (filters.search) {
      const s = filters.search.toLowerCase()
      list = list.filter(o =>
        (o.order_id || '').toLowerCase().includes(s) ||
        (o.buyer_id || '').toString().toLowerCase().includes(s)
      )
    }
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  }, [orders, filters])

  const fmtRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`
  const fmtDate = (d) => {
    if (!d) return '—'
    try { return format(parseISO(d), 'dd MMM yyyy') } catch { return d }
  }

  const parseItems = (items) => {
    if (!items) return []
    try { return typeof items === 'string' ? JSON.parse(items) : items } catch { return [] }
  }

  const handleStatusChange = async (id, field, value) => {
    try {
      await update(id, { [field]: value })
      if (selected?.id === id) setSelected(prev => ({ ...prev, [field]: value }))
      toast.success(`${field === 'status' ? 'Status' : 'Payment'} updated`)
    } catch (err) {
      toast.error('Update failed: ' + err.message)
    }
  }

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Buyer', 'Date', 'Total', 'Profit', 'Status', 'Payment']
    const rows = filtered.map(o => [o.order_id, o.buyer_id, o.date, o.total, o.profit, o.status, o.payment_status])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  const printInvoice = (order) => {
    const items = parseItems(order.items)
    const companyName = process.env.REACT_APP_COMPANY_NAME || 'Nantara'
    const html = `<!DOCTYPE html><html><head><style>
      body{font-family:Inter,sans-serif;padding:40px;color:#111}
      h1{font-size:24px;margin-bottom:4px} .meta{color:#666;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #ddd;font-size:13px}
      th{background:#f5f5f5;font-weight:600} .right{text-align:right}
      .total{font-size:16px;font-weight:600;margin-top:20px}
    </style></head><body>
      <h1>${companyName}</h1>
      <div class="meta">Invoice #${order.order_id || ''} · ${fmtDate(order.date)}</div>
      <div class="meta">Buyer: ${order.buyer_id || '—'}</div>
      <table><thead><tr><th>Product</th><th>Qty</th><th class="right">Unit Price</th><th class="right">Subtotal</th></tr></thead>
      <tbody>${items.map(item => `<tr>
        <td>${item.product || item.name || '—'}</td>
        <td>${item.qty || item.quantity || 0}</td>
        <td class="right">${fmtRp(item.price || item.unit_price || 0)}</td>
        <td class="right">${fmtRp((item.qty || item.quantity || 0) * (item.price || item.unit_price || 0))}</td>
      </tr>`).join('')}</tbody></table>
      <div class="total">Total: ${fmtRp(order.total)}</div>
      <div class="meta" style="margin-top:4px">Profit: ${fmtRp(order.profit)}</div>
    </body></html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.print()
  }

  const columns = [
    { key: 'order_id', label: 'Order ID', width: '120px' },
    { key: 'buyer_id', label: 'Buyer' },
    { key: 'date', label: 'Date', render: (v) => fmtDate(v) },
    { key: 'items', label: 'Items', render: (v) => { const items = parseItems(v); return `${items.length} item${items.length !== 1 ? 's' : ''}` } },
    { key: 'total', label: 'Total', render: (v) => fmtRp(v) },
    { key: 'profit', label: 'Profit', render: (v) => fmtRp(v) },
    { key: 'status', label: 'Status', render: (v) => <Badge>{v || 'pending'}</Badge> },
    { key: 'payment_status', label: 'Payment', render: (v) => <Badge>{v || 'unpaid'}</Badge> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search order ID or buyer..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="bg-bg-elevated border border-border rounded-md px-3 py-1.5 text-[13px] text-txt-primary placeholder:text-txt-tertiary outline-none focus:border-accent-primary w-64"
        />
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="bg-bg-elevated border border-border rounded-md px-3 py-1.5 text-[13px] text-txt-primary outline-none"
        >
          <option value="">All Status</option>
          {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.payment}
          onChange={e => setFilters(f => ({ ...f, payment: e.target.value }))}
          className="bg-bg-elevated border border-border rounded-md px-3 py-1.5 text-[13px] text-txt-primary outline-none"
        >
          <option value="">All Payment</option>
          {['unpaid', 'paid', 'overdue'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 text-[12px] font-medium bg-bg-elevated border border-border text-txt-secondary rounded-md hover:text-txt-primary transition-colors"
        >
          Export CSV
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        onRowClick={setSelected}
        emptyMessage="No orders found"
      />

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Order ${selected?.order_id || ''}`} width="max-w-3xl">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-txt-tertiary uppercase">Buyer</div>
                <div className="text-[14px] text-txt-primary font-medium">{selected.buyer_id || '—'}</div>
              </div>
              <div>
                <div className="text-[11px] text-txt-tertiary uppercase">Date</div>
                <div className="text-[14px] text-txt-primary">{fmtDate(selected.date)}</div>
              </div>
              <div>
                <div className="text-[11px] text-txt-tertiary uppercase mb-1">Status</div>
                <select
                  value={selected.status || 'pending'}
                  onChange={e => handleStatusChange(selected.id, 'status', e.target.value)}
                  className="bg-bg-elevated border border-border rounded px-2 py-1 text-[13px] text-txt-primary outline-none"
                >
                  {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[11px] text-txt-tertiary uppercase mb-1">Payment</div>
                <select
                  value={selected.payment_status || 'unpaid'}
                  onChange={e => handleStatusChange(selected.id, 'payment_status', e.target.value)}
                  className="bg-bg-elevated border border-border rounded px-2 py-1 text-[13px] text-txt-primary outline-none"
                >
                  {['unpaid', 'paid', 'overdue'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="text-[12px] text-txt-tertiary uppercase mb-2">Items</div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[11px] text-txt-tertiary font-medium py-2">Product</th>
                    <th className="text-right text-[11px] text-txt-tertiary font-medium py-2">Qty</th>
                    <th className="text-right text-[11px] text-txt-tertiary font-medium py-2">Unit Price</th>
                    <th className="text-right text-[11px] text-txt-tertiary font-medium py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {parseItems(selected.items).map((item, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 text-[13px] text-txt-primary">{item.product || item.name || '—'}</td>
                      <td className="py-2 text-[13px] text-txt-secondary text-right">{item.qty || item.quantity || 0}</td>
                      <td className="py-2 text-[13px] text-txt-secondary text-right">{fmtRp(item.price || item.unit_price)}</td>
                      <td className="py-2 text-[13px] text-txt-primary text-right font-medium">
                        {fmtRp((item.qty || item.quantity || 0) * (item.price || item.unit_price || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <div className="text-[14px] text-txt-primary font-semibold">Total: {fmtRp(selected.total)}</div>
                <div className="text-[12px] text-txt-secondary">Profit: {fmtRp(selected.profit)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => printInvoice(selected)}
                  className="px-3 py-1.5 text-[12px] font-medium bg-bg-elevated border border-border text-txt-secondary rounded-md hover:text-txt-primary transition-colors"
                >
                  Print Invoice
                </button>
              </div>
            </div>

            {selected.notes && (
              <div>
                <div className="text-[11px] text-txt-tertiary uppercase mb-1">Notes</div>
                <div className="text-[13px] text-txt-secondary whitespace-pre-wrap">{selected.notes}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
