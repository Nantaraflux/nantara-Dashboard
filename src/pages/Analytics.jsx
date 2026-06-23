import React, { useState, useMemo } from 'react'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { useAirtable } from '../hooks/useAirtable'
import { getInsights } from '../config/groq'
import { format, subDays, parseISO } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend)

const chartColors = {
  bg: '#1A2235', border: '#1F2D40',
  tooltip: { backgroundColor: '#1A2235', borderColor: '#1F2D40', borderWidth: 1, titleFont: { family: 'Inter', size: 12 }, bodyFont: { family: 'Inter', size: 12 }, padding: 10 },
  axis: { grid: { color: '#1F2D40', lineWidth: 0.5 }, ticks: { color: '#4A5568', font: { size: 11, family: 'Inter' } }, border: { display: false } },
  noGrid: { grid: { display: false }, ticks: { color: '#4A5568', font: { size: 11, family: 'Inter' } }, border: { display: false } },
}

export default function Analytics() {
  const { data: orders } = useAirtable('Orders')
  const { data: buyers } = useAirtable('Buyers')
  const { data: products } = useAirtable('Products')
  const [range, setRange] = useState(30)
  const [aiReport, setAiReport] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const cutoff = subDays(new Date(), range)
  const rangeOrders = useMemo(() => orders.filter(o => {
    try { return parseISO(o.date) >= cutoff } catch { return false }
  }), [orders, cutoff])

  const fmtRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`

  const dailyData = useMemo(() => {
    return Array.from({ length: range }, (_, i) => {
      const date = subDays(new Date(), range - 1 - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayOrders = rangeOrders.filter(o => { try { return format(parseISO(o.date), 'yyyy-MM-dd') === dateStr } catch { return false } })
      return {
        label: format(date, 'dd MMM'),
        revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
        orders: dayOrders.length,
        avgValue: dayOrders.length > 0 ? dayOrders.reduce((s, o) => s + (o.total || 0), 0) / dayOrders.length : 0,
      }
    })
  }, [rangeOrders, range])

  const statusBreakdown = useMemo(() => {
    const counts = {}
    rangeOrders.forEach(o => { const s = o.status || 'pending'; counts[s] = (counts[s] || 0) + 1 })
    return counts
  }, [rangeOrders])

  const channelBreakdown = useMemo(() => {
    const counts = {}
    rangeOrders.forEach(o => { const c = o.channel || 'manual'; counts[c] = (counts[c] || 0) + (o.total || 0) })
    return counts
  }, [rangeOrders])

  const topBuyers = useMemo(() => {
    return [...buyers]
      .sort((a, b) => (b.total_spend || 0) - (a.total_spend || 0))
      .slice(0, 10)
  }, [buyers])

  const topProductsByRevenue = useMemo(() => {
    const rev = {}
    rangeOrders.forEach(o => {
      try {
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items
        if (Array.isArray(items)) items.forEach(item => {
          const name = item.product || item.name || 'Unknown'
          rev[name] = (rev[name] || 0) + ((item.qty || item.quantity || 1) * (item.price || item.unit_price || 0))
        })
      } catch {}
    })
    return Object.entries(rev).sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [rangeOrders])

  const generateAiReport = async () => {
    setAiLoading(true)
    try {
      const result = await getInsights({
        period: `${range} days`,
        totalRevenue: rangeOrders.reduce((s, o) => s + (o.total || 0), 0),
        totalOrders: rangeOrders.length,
        avgOrderValue: rangeOrders.length > 0 ? rangeOrders.reduce((s, o) => s + (o.total || 0), 0) / rangeOrders.length : 0,
        statusBreakdown,
        topBuyers: topBuyers.slice(0, 5).map(b => ({ name: b.name, spend: b.total_spend })),
        topProducts: topProductsByRevenue.slice(0, 5),
        totalBuyers: buyers.length,
      })
      setAiReport({ ...result, timestamp: new Date().toISOString() })
    } catch (err) {
      setAiReport({ insights: ['Failed: ' + err.message], actions: [], timestamp: new Date().toISOString() })
    }
    setAiLoading(false)
  }

  const pieColors = ['#0F6E56', '#1D9E75', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {[{ label: '7d', value: 7 }, { label: '30d', value: 30 }, { label: '90d', value: 90 }].map(r => (
          <button key={r.value} onClick={() => setRange(r.value)} className={`px-3 py-1.5 text-[12px] font-medium rounded-md ${range === r.value ? 'bg-accent-primary text-white' : 'bg-bg-elevated border border-border text-txt-secondary hover:text-txt-primary'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-bg-elevated border border-border rounded-md p-4">
          <div className="text-label text-txt-secondary mb-3">Revenue Trend</div>
          <div className="h-[220px]">
            <Line data={{
              labels: dailyData.map(d => d.label),
              datasets: [{ data: dailyData.map(d => d.revenue), borderColor: '#0F6E56', backgroundColor: 'rgba(15,110,86,0.08)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0 }],
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { tooltip: chartColors.tooltip, legend: { display: false } }, scales: { x: chartColors.noGrid, y: { ...chartColors.axis, ticks: { ...chartColors.axis.ticks, callback: v => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v } } } }} />
          </div>
        </div>
        <div className="bg-bg-elevated border border-border rounded-md p-4">
          <div className="text-label text-txt-secondary mb-3">Revenue by Channel</div>
          <div className="h-[220px] flex items-center justify-center">
            {Object.keys(channelBreakdown).length > 0 ? (
              <Doughnut data={{
                labels: Object.keys(channelBreakdown),
                datasets: [{ data: Object.values(channelBreakdown), backgroundColor: pieColors, borderWidth: 0 }],
              }} options={{ responsive: true, maintainAspectRatio: false, plugins: { tooltip: chartColors.tooltip, legend: { position: 'bottom', labels: { color: '#8B9AB0', font: { size: 11, family: 'Inter' }, padding: 12 } } } }} />
            ) : <span className="text-txt-tertiary text-[13px]">No data</span>}
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-bg-elevated border border-border rounded-md p-4">
          <div className="text-label text-txt-secondary mb-3">Orders per Day</div>
          <div className="h-[200px]">
            <Bar data={{
              labels: dailyData.map(d => d.label),
              datasets: [{ data: dailyData.map(d => d.orders), backgroundColor: '#3B82F6', borderRadius: 3, barThickness: range > 30 ? 4 : 8 }],
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { tooltip: chartColors.tooltip, legend: { display: false } }, scales: { x: { ...chartColors.noGrid, ticks: { ...chartColors.noGrid.ticks, maxTicksLimit: 8 } }, y: chartColors.axis } }} />
          </div>
        </div>
        <div className="bg-bg-elevated border border-border rounded-md p-4">
          <div className="text-label text-txt-secondary mb-3">Avg Order Value</div>
          <div className="h-[200px]">
            <Line data={{
              labels: dailyData.map(d => d.label),
              datasets: [{ data: dailyData.map(d => d.avgValue), borderColor: '#F59E0B', borderWidth: 2, tension: 0.3, pointRadius: 0, fill: false }],
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { tooltip: { ...chartColors.tooltip, callbacks: { label: ctx => fmtRp(ctx.raw) } }, legend: { display: false } }, scales: { x: { ...chartColors.noGrid, ticks: { ...chartColors.noGrid.ticks, maxTicksLimit: 8 } }, y: chartColors.axis } }} />
          </div>
        </div>
        <div className="bg-bg-elevated border border-border rounded-md p-4">
          <div className="text-label text-txt-secondary mb-3">Order Status</div>
          <div className="h-[200px] flex items-center justify-center">
            {Object.keys(statusBreakdown).length > 0 ? (
              <Pie data={{
                labels: Object.keys(statusBreakdown),
                datasets: [{ data: Object.values(statusBreakdown), backgroundColor: pieColors, borderWidth: 0 }],
              }} options={{ responsive: true, maintainAspectRatio: false, plugins: { tooltip: chartColors.tooltip, legend: { position: 'bottom', labels: { color: '#8B9AB0', font: { size: 11, family: 'Inter' }, padding: 8 } } } }} />
            ) : <span className="text-txt-tertiary text-[13px]">No data</span>}
          </div>
        </div>
      </div>

      {/* Top Buyers + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-bg-elevated border border-border rounded-md">
          <div className="px-4 py-3 border-b border-border text-label text-txt-secondary">Top 10 Buyers</div>
          <table className="w-full">
            <thead><tr className="border-b border-border">
              <th className="text-left text-[11px] text-txt-tertiary font-medium px-4 py-2">#</th>
              <th className="text-left text-[11px] text-txt-tertiary font-medium px-4 py-2">Name</th>
              <th className="text-right text-[11px] text-txt-tertiary font-medium px-4 py-2">Orders</th>
              <th className="text-right text-[11px] text-txt-tertiary font-medium px-4 py-2">Spend</th>
            </tr></thead>
            <tbody>
              {topBuyers.map((b, i) => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 text-[12px] text-txt-tertiary">{i + 1}</td>
                  <td className="px-4 py-2 text-[13px] text-txt-primary">{b.name}</td>
                  <td className="px-4 py-2 text-[13px] text-txt-secondary text-right">{b.total_orders || 0}</td>
                  <td className="px-4 py-2 text-[13px] text-txt-primary text-right font-medium">{fmtRp(b.total_spend)}</td>
                </tr>
              ))}
              {topBuyers.length === 0 && <tr><td colSpan="4" className="px-4 py-6 text-center text-txt-tertiary text-[13px]">No buyers</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="bg-bg-elevated border border-border rounded-md p-4">
          <div className="text-label text-txt-secondary mb-3">Top Products by Revenue</div>
          <div className="h-[280px]">
            {topProductsByRevenue.length > 0 ? (
              <Bar data={{
                labels: topProductsByRevenue.map(([name]) => name.length > 15 ? name.slice(0, 15) + '...' : name),
                datasets: [{ data: topProductsByRevenue.map(([, rev]) => rev), backgroundColor: '#0F6E56', hoverBackgroundColor: '#1D9E75', borderRadius: 3, barThickness: 18 }],
              }} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { tooltip: { ...chartColors.tooltip, callbacks: { label: ctx => fmtRp(ctx.raw) } }, legend: { display: false } }, scales: { x: chartColors.axis, y: chartColors.noGrid } }} />
            ) : <div className="flex items-center justify-center h-full text-txt-tertiary text-[13px]">No data</div>}
          </div>
        </div>
      </div>

      {/* AI Report */}
      <div className="bg-bg-elevated border border-border rounded-md">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-label text-txt-secondary">AI Analysis</span>
          <button onClick={generateAiReport} disabled={aiLoading} className="px-3 py-1.5 text-[12px] font-medium bg-accent-primary text-white rounded-md hover:bg-accent-secondary disabled:opacity-50">
            {aiLoading ? 'Generating...' : 'Generate AI Report'}
          </button>
        </div>
        <div className="p-4">
          {!aiReport ? (
            <div className="text-[13px] text-txt-tertiary text-center py-4">Click to generate AI-powered analytics report</div>
          ) : (
            <div>
              <div className="text-[11px] text-txt-tertiary mb-3">Generated: {format(parseISO(aiReport.timestamp), 'dd MMM yyyy HH:mm')}</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <div className="text-[12px] text-txt-tertiary uppercase tracking-wide mb-2">Insights</div>
                  {(aiReport.insights || []).map((item, i) => (
                    <div key={i} className="flex gap-2 text-[13px] text-txt-secondary mb-2">
                      <span className="text-accent-secondary">•</span><span>{item}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[12px] text-txt-tertiary uppercase tracking-wide mb-2">Actions</div>
                  {(aiReport.actions || []).map((item, i) => (
                    <div key={i} className="flex gap-2 text-[13px] text-txt-secondary mb-2">
                      <span className="text-warning">→</span><span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
