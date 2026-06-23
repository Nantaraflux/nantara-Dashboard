import React, { useState } from 'react'
import { useToast } from '../components/ui/Toast'
import { fetchTable } from '../config/airtable'
import { logActivity } from '../utils/userManagement'
import Modal from '../components/ui/Modal'
import { format } from 'date-fns'

export default function Settings({ currentUser }) {
  const toast = useToast()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [tempValue, setTempValue] = useState('')

  // Only Owner can access Settings
  const isOwner = currentUser?.role === 'Owner'

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('nantara_api_config')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return {
      airtableBase: process.env.REACT_APP_AIRTABLE_BASE_ID || '',
      airtableKey: process.env.REACT_APP_AIRTABLE_API_KEY || '',
      groqKey: process.env.REACT_APP_GROQ_API_KEY || '',
      n8nSendWa: process.env.REACT_APP_N8N_SEND_WA_WEBHOOK || '',
      n8nFollowup: process.env.REACT_APP_N8N_FOLLOWUP_WEBHOOK || '',
      companyName: process.env.REACT_APP_COMPANY_NAME || 'Nantara',
      primaryColor: process.env.REACT_APP_PRIMARY_COLOR || '#0F6E56',
      waNumber: process.env.REACT_APP_DEFAULT_WA_NUMBER || '',
    }
  })

  if (!isOwner) {
    return (
      <div className="bg-bg-surface border border-border rounded-lg p-8 text-center max-w-2xl">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" className="mx-auto mb-4 opacity-60">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2 className="text-xl font-semibold text-txt-primary mb-2">⛔ Access Denied</h2>
        <p className="text-txt-secondary">Hanya Owner yang bisa mengakses dan mengubah API Configuration.</p>
        <p className="text-txt-tertiary text-[12px] mt-3">Role kamu: <strong>{currentUser?.role}</strong></p>
      </div>
    )
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      await fetchTable('Orders', { maxRecords: 1 })
      setTestResult({ success: true, message: '✓ Airtable connection successful' })
      toast.success('Airtable connection OK')
      logActivity('TEST_CONNECTION', 'Tested Airtable connection - SUCCESS', currentUser?.id)
    } catch (err) {
      setTestResult({ success: false, message: '✗ ' + err.message })
      toast.error('Connection failed: ' + err.message)
      logActivity('TEST_CONNECTION', 'Tested Airtable connection - FAILED: ' + err.message, currentUser?.id)
    }
    setTesting(false)
  }

  const handleSaveConfig = (field, value) => {
    const newConfig = { ...config, [field]: value }
    setConfig(newConfig)
    localStorage.setItem('nantara_api_config', JSON.stringify(newConfig))
    logActivity('API_CONFIG_CHANGED', `Updated ${field}`, currentUser?.id)
    toast.success(`${field} updated`)
    setEditModal(null)
  }

  const exportAllCSV = async () => {
    try {
      const tables = ['Orders', 'Buyers', 'Products', 'Chats', 'Pipeline', 'Followups']
      let exported = 0
      for (const table of tables) {
        try {
          const records = await fetchTable(table)
          if (records.length === 0) continue
          const headers = Object.keys(records[0]).filter(k => k !== 'id')
          const rows = records.map(r => headers.map(h => {
            const v = r[h]
            return typeof v === 'string' && v.includes(',') ? `"${v}"` : v
          }).join(','))
          const csv = [headers.join(','), ...rows].join('\n')
          const blob = new Blob([csv], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${table.toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}.csv`
          a.click()
          URL.revokeObjectURL(url)
          exported++
        } catch {}
      }
      toast.success(`Exported ${exported} tables`)
      logActivity('DATA_EXPORT', `Exported ${exported} data tables`, currentUser?.id)
    } catch (err) {
      toast.error('Export failed: ' + err.message)
    }
  }

  const ConfigField = ({ label, field, value, type = 'text', icon }) => (
    <div className="flex items-center justify-between p-3 bg-bg-surface rounded border border-border">
      <div>
        <div className="text-[12px] text-txt-tertiary uppercase font-semibold">{label}</div>
        <div className="text-[13px] text-txt-primary font-mono mt-1">
          {type === 'password' ? '••••••••' : (value?.substring(0, 40) + (value?.length > 40 ? '...' : ''))}
        </div>
      </div>
      <button
        onClick={() => { setEditModal(field); setTempValue(value) }}
        className="px-3 py-1.5 text-[12px] font-medium bg-accent-primary text-white rounded hover:bg-accent-secondary transition-colors"
      >
        {icon} Edit
      </button>
    </div>
  )

  const Section = ({ title, children }) => (
    <div className="bg-bg-elevated border border-border rounded-md">
      <div className="px-5 py-3 border-b border-border">
        <span className="text-[14px] text-txt-primary font-semibold">🔐 {title}</span>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  )

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-blue-500/15 border border-blue-500/30 rounded-lg p-4">
        <p className="text-[13px] text-blue-300">
          ⚠️ <strong>Owner-Only Access:</strong> Sensitive API configurations are restricted to Owner role only. All changes are logged.
        </p>
      </div>

      <Section title="Airtable Configuration">
        <ConfigField label="Base ID" field="airtableBase" value={config.airtableBase} icon="📌" />
        <ConfigField label="API Key" field="airtableKey" value={config.airtableKey} type="password" icon="🔑" />
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={testConnection}
            disabled={testing}
            className="px-4 py-2 bg-success/15 text-success text-[13px] font-medium rounded-md hover:bg-success/25 disabled:opacity-50 transition-colors"
          >
            {testing ? '⏳ Testing...' : '✓ Test Connection'}
          </button>
          {testResult && (
            <span className={`text-[13px] ${testResult.success ? 'text-success' : 'text-danger'}`}>
              {testResult.message}
            </span>
          )}
        </div>
      </Section>

      <Section title="Groq AI Configuration">
        <ConfigField label="API Key" field="groqKey" value={config.groqKey} type="password" icon="🤖" />
        <p className="text-[12px] text-txt-tertiary">Used for AI insights on Overview and Analytics pages.</p>
      </Section>

      <Section title="N8N Webhooks">
        <ConfigField label="Send WhatsApp Webhook" field="n8nSendWa" value={config.n8nSendWa} icon="💬" />
        <ConfigField label="Follow-up Webhook" field="n8nFollowup" value={config.n8nFollowup} icon="⏰" />
      </Section>

      <Section title="White Label">
        <ConfigField label="Company Name" field="companyName" value={config.companyName} icon="🏢" />
        <div className="flex items-center justify-between p-3 bg-bg-surface rounded border border-border">
          <div>
            <div className="text-[12px] text-txt-tertiary uppercase font-semibold">Primary Color</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: config.primaryColor }}></div>
              <span className="text-[13px] text-txt-primary font-mono">{config.primaryColor}</span>
            </div>
          </div>
          <button
            onClick={() => { setEditModal('primaryColor'); setTempValue(config.primaryColor) }}
            className="px-3 py-1.5 text-[12px] font-medium bg-accent-primary text-white rounded hover:bg-accent-secondary transition-colors"
          >
            🎨 Edit
          </button>
        </div>
        <ConfigField label="WhatsApp Number" field="waNumber" value={config.waNumber} icon="📱" />
      </Section>

      <Section title="Data Export">
        <p className="text-[12px] text-txt-secondary mb-3">Download all Airtable data as CSV files for backup.</p>
        <button
          onClick={exportAllCSV}
          className="px-4 py-2 bg-bg-surface border border-border text-txt-secondary text-[13px] font-medium rounded-md hover:text-txt-primary transition-colors"
        >
          📥 Export All Tables (CSV)
        </button>
      </Section>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Configuration" width="max-w-md">
        <div className="space-y-4">
          <div className="bg-bg-elevated rounded p-3">
            <div className="text-[12px] text-txt-tertiary uppercase mb-2">Field</div>
            <div className="text-[13px] font-semibold text-txt-primary capitalize">
              {editModal?.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </div>

          {editModal === 'primaryColor' ? (
            <div>
              <label className="text-[12px] font-semibold text-txt-secondary block mb-2">Color Value</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-16 h-10 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  placeholder="#0F6E56"
                  className="flex-1 bg-bg-elevated border border-border rounded-md px-3 py-2 text-[13px] text-txt-primary outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[12px] font-semibold text-txt-secondary block mb-2">Value</label>
              <textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-[13px] text-txt-primary outline-none focus:border-accent-primary min-h-[100px] font-mono"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleSaveConfig(editModal, tempValue)}
              className="flex-1 px-3 py-2 bg-success/15 text-success text-[13px] font-medium rounded-md hover:bg-success/25 transition-colors"
            >
              ✓ Save
            </button>
            <button
              onClick={() => setEditModal(null)}
              className="flex-1 px-3 py-2 bg-bg-elevated border border-border text-txt-secondary text-[13px] font-medium rounded-md hover:text-txt-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
