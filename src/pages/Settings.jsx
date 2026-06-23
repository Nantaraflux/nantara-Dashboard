import React, { useState } from 'react'
import { fetchTable } from '../config/airtable'
import { useToast } from '../components/ui/Toast'
import { format } from 'date-fns'

export default function Settings() {
  const toast = useToast()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const [config, setConfig] = useState({
    airtableBase: process.env.REACT_APP_AIRTABLE_BASE_ID || '',
    airtableKey: process.env.REACT_APP_AIRTABLE_API_KEY || '',
    groqKey: process.env.REACT_APP_GROQ_API_KEY || '',
    n8nSendWa: process.env.REACT_APP_N8N_SEND_WA_WEBHOOK || '',
    n8nFollowup: process.env.REACT_APP_N8N_FOLLOWUP_WEBHOOK || '',
    companyName: process.env.REACT_APP_COMPANY_NAME || 'Nantara',
    primaryColor: process.env.REACT_APP_PRIMARY_COLOR || '#0F6E56',
    waNumber: process.env.REACT_APP_DEFAULT_WA_NUMBER || '',
  })

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      await fetchTable('Orders', { maxRecords: 1 })
      setTestResult({ success: true, message: 'Connected to Airtable successfully' })
      toast.success('Airtable connection OK')
    } catch (err) {
      setTestResult({ success: false, message: err.message })
      toast.error('Connection failed: ' + err.message)
    }
    setTesting(false)
  }

  const exportAllCSV = async () => {
    const tables = ['Orders', 'Buyers', 'Products', 'Chats', 'Pipeline', 'Followups']
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
      } catch {}
    }
    toast.success('Export complete')
  }

  const Section = ({ title, children }) => (
    <div className="bg-bg-elevated border border-border rounded-md">
      <div className="px-5 py-3 border-b border-border">
        <span className="text-[14px] text-txt-primary font-semibold">{title}</span>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )

  const Field = ({ label, value, onChange, type = 'text', placeholder, readOnly }) => (
    <div>
      <label className="text-[12px] text-txt-secondary block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full bg-bg-surface border border-border rounded-md px-3 py-2 text-[13px] text-txt-primary placeholder:text-txt-tertiary outline-none focus:border-accent-primary ${readOnly ? 'opacity-60' : ''}`}
      />
    </div>
  )

  return (
    <div className="space-y-4 max-w-3xl">
      <Section title="Airtable Configuration">
        <Field label="Base ID" value={config.airtableBase} onChange={v => setConfig(c => ({ ...c, airtableBase: v }))} placeholder="appXXXXXXXXXXXXXX" readOnly />
        <Field label="API Key" value={config.airtableKey} onChange={v => setConfig(c => ({ ...c, airtableKey: v }))} type="password" placeholder="patXXXXXXXXXXXXXX" readOnly />
        <div className="flex items-center gap-3">
          <button onClick={testConnection} disabled={testing} className="px-4 py-2 bg-accent-primary text-white text-[13px] font-medium rounded-md hover:bg-accent-secondary disabled:opacity-50">
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          {testResult && (
            <span className={`text-[13px] ${testResult.success ? 'text-success' : 'text-danger'}`}>
              {testResult.message}
            </span>
          )}
        </div>
        <p className="text-[12px] text-txt-tertiary">API keys are set via environment variables (.env file). Restart the app after changes.</p>
      </Section>

      <Section title="Groq AI Configuration">
        <Field label="API Key" value={config.groqKey} onChange={v => setConfig(c => ({ ...c, groqKey: v }))} type="password" placeholder="gsk_XXXXXXXXXXXX" readOnly />
        <p className="text-[12px] text-txt-tertiary">Used for AI insights on Overview and Analytics pages.</p>
      </Section>

      <Section title="N8N Webhooks">
        <Field label="Send WhatsApp Webhook" value={config.n8nSendWa} onChange={v => setConfig(c => ({ ...c, n8nSendWa: v }))} placeholder="https://your-n8n.com/webhook/send-wa" readOnly />
        <Field label="Follow-up Webhook" value={config.n8nFollowup} onChange={v => setConfig(c => ({ ...c, n8nFollowup: v }))} placeholder="https://your-n8n.com/webhook/followup" readOnly />
      </Section>

      <Section title="White Label">
        <Field label="Company Name" value={config.companyName} onChange={v => setConfig(c => ({ ...c, companyName: v }))} placeholder="Your company name" readOnly />
        <div>
          <label className="text-[12px] text-txt-secondary block mb-1">Primary Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={config.primaryColor}
              onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))}
              className="w-10 h-10 rounded border border-border cursor-pointer"
              disabled
            />
            <span className="text-[13px] text-txt-primary">{config.primaryColor}</span>
          </div>
        </div>
        <p className="text-[12px] text-txt-tertiary">White label settings are configured via environment variables.</p>
      </Section>

      <Section title="WhatsApp">
        <Field label="Default WA Number" value={config.waNumber} onChange={v => setConfig(c => ({ ...c, waNumber: v }))} placeholder="628XXXXXXXXX" readOnly />
      </Section>

      <Section title="Data Export">
        <p className="text-[12px] text-txt-secondary mb-3">Download all Airtable data as CSV files.</p>
        <button onClick={exportAllCSV} className="px-4 py-2 bg-bg-surface border border-border text-txt-secondary text-[13px] font-medium rounded-md hover:text-txt-primary">
          Export All Tables (CSV)
        </button>
      </Section>
    </div>
  )
}
