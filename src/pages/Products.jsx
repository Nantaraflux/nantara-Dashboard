import React, { useState, useMemo } from 'react'
import { useAirtable } from '../hooks/useAirtable'
import { useToast } from '../components/ui/Toast'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'

export default function Products() {
  const { data: products, loading, update, create } = useAirtable('Products')
  const toast = useToast()
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editCell, setEditCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [filters, setFilters] = useState({ category: '', activeOnly: false, lowMargin: false, search: '' })
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', cost: '', price: '', stock_qty: '', category: '', active: true })

  const filtered = useMemo(() => {
    let list = products
    if (filters.category) list = list.filter(p => p.category === filters.category)
    if (filters.activeOnly) list = list.filter(p => p.active)
    if (filters.lowMargin) list = list.filter(p => (p.margin_pct || 0) < 20)
    if (filters.search) {
      const s = filters.search.toLowerCase()
      list = list.filter(p => (p.name || '').toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s))
    }
    return list
  }, [products, filters])

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  const fmtRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`

  const handleInlineEdit = async (id, field) => {
    const numValue = parseFloat(editValue)
    if (isNaN(numValue)) { toast.error('Invalid number'); return }
    try {
      await update(id, { [field]: numValue })
      toast.success('Updated')
    } catch (err) {
      toast.error('Update failed: ' + err.message)
    }
    setEditCell(null)
  }

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) { toast.error('Name is required'); return }
    try {
      const fields = {
        ...newProduct,
        cost: parseFloat(newProduct.cost) || 0,
        price: parseFloat(newProduct.price) || 0,
        stock_qty: parseInt(newProduct.stock_qty) || 0,
      }
      await create(fields)
      setShowAdd(false)
      setNewProduct({ name: '', sku: '', cost: '', price: '', stock_qty: '', category: '', active: true })
      toast.success('Product created')
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  const renderEditable = (value, row, field) => {
    const isEditing = editCell?.id === row.id && editCell?.field === field
    if (isEditing) {
      return (
        <input
          autoFocus
          type="number"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={() => handleInlineEdit(row.id, field)}
          onKeyDown={e => { if (e.key === 'Enter') handleInlineEdit(row.id, field); if (e.key === 'Escape') setEditCell(null) }}
          className="w-20 bg-bg-surface border border-accent-primary rounded px-2 py-0.5 text-[13px] text-txt-primary outline-none"
        />
      )
    }
    return (
      <span
        className="cursor-pointer hover:text-accent-secondary"
        onClick={e => { e.stopPropagation(); setEditCell({ id: row.id, field }); setEditValue(value || '') }}
      >
        {field === 'stock_qty' ? (value || 0) : fmtRp(value)}
      </span>
    )
  }

  const columns = [
    { key: 'sku', label: 'SKU', width: '100px' },
    { key: 'name', label: 'Name', render: (v) => <span className="font-medium">{v || '—'}</span> },
    { key: 'category', label: 'Category' },
    { key: 'cost', label: 'Cost', render: (v, row) => renderEditable(v, row, 'cost') },
    { key: 'price', label: 'Price', render: (v, row) => renderEditable(v, row, 'price') },
    { key: 'margin_pct', label: 'Margin', render: (v) => {
      const m = v || 0
      return <span className={m < 20 ? 'text-danger' : m > 50 ? 'text-success' : 'text-txt-primary'}>{m.toFixed(1)}%</span>
    }},
    { key: 'stock_qty', label: 'Stock', render: (v, row) => {
      const val = v || 0
      return (
        <span className={val < 10 ? 'text-danger font-medium' : ''}>
          {renderEditable(val, row, 'stock_qty')}
          {val < 10 && <span className="ml-1 text-[10px]">LOW</span>}
        </span>
      )
    }},
    { key: 'active', label: 'Active', render: (v) => v ? <Badge variant="success">Active</Badge> : <Badge>Inactive</Badge> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search name or SKU..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="bg-bg-elevated border border-border rounded-md px-3 py-1.5 text-[13px] text-txt-primary placeholder:text-txt-tertiary outline-none focus:border-accent-primary w-56"
        />
        <select
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          className="bg-bg-elevated border border-border rounded-md px-3 py-1.5 text-[13px] text-txt-primary outline-none"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-[13px] text-txt-secondary cursor-pointer">
          <input type="checkbox" checked={filters.activeOnly} onChange={e => setFilters(f => ({ ...f, activeOnly: e.target.checked }))} className="rounded" />
          Active only
        </label>
        <label className="flex items-center gap-2 text-[13px] text-txt-secondary cursor-pointer">
          <input type="checkbox" checked={filters.lowMargin} onChange={e => setFilters(f => ({ ...f, lowMargin: e.target.checked }))} className="rounded" />
          Low margin (&lt;20%)
        </label>
        <div className="flex-1" />
        <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 text-[12px] font-medium bg-accent-primary text-white rounded-md hover:bg-accent-secondary transition-colors">
          Add Product
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        onRowClick={setSelected}
        emptyMessage="No products found"
        emptyAction={<button onClick={() => setShowAdd(true)} className="px-3 py-1.5 text-[12px] font-medium bg-accent-primary text-white rounded-md">Add first product</button>}
      />

      {/* Product Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || 'Product'}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'SKU', value: selected.sku },
                { label: 'Category', value: selected.category },
                { label: 'Cost', value: fmtRp(selected.cost) },
                { label: 'Price', value: fmtRp(selected.price) },
                { label: 'Margin', value: `${(selected.margin_pct || 0).toFixed(1)}%` },
                { label: 'Stock', value: selected.stock_qty || 0 },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-[11px] text-txt-tertiary uppercase">{f.label}</div>
                  <div className="text-[14px] text-txt-primary font-medium">{f.value || '—'}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-txt-secondary">Status:</span>
              <Badge variant={selected.active ? 'success' : 'default'}>{selected.active ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Product Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Product" width="max-w-md">
        <div className="space-y-3">
          {[
            { key: 'name', label: 'Name', placeholder: 'Product name', required: true },
            { key: 'sku', label: 'SKU', placeholder: 'SKU code' },
            { key: 'category', label: 'Category', placeholder: 'e.g. Electronics' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[12px] text-txt-secondary block mb-1">{f.label}{f.required && ' *'}</label>
              <input type="text" value={newProduct[f.key]} onChange={e => setNewProduct(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-[13px] text-txt-primary placeholder:text-txt-tertiary outline-none focus:border-accent-primary" />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'cost', label: 'Cost (Rp)' },
              { key: 'price', label: 'Price (Rp)' },
              { key: 'stock_qty', label: 'Stock' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[12px] text-txt-secondary block mb-1">{f.label}</label>
                <input type="number" value={newProduct[f.key]} onChange={e => setNewProduct(prev => ({ ...prev, [f.key]: e.target.value }))} className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-[13px] text-txt-primary outline-none focus:border-accent-primary" />
              </div>
            ))}
          </div>
          <button onClick={handleAddProduct} className="w-full px-3 py-2 bg-accent-primary text-white text-[13px] font-medium rounded-md hover:bg-accent-secondary transition-colors">
            Add Product
          </button>
        </div>
      </Modal>
    </div>
  )
}
