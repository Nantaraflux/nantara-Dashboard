import React, { useState } from 'react'
import { useAirtable } from '../hooks/useAirtable'
import { useMetrics } from '../hooks/useMetrics'
import { getInsights } from '../config/groq'
import MetricCard from '../components/ui/MetricCard'
import Badge from '../components/ui/Badge'
import RevenueChart from '../components/charts/RevenueChart'
import ProductChart from '../components/charts/ProductChart'
import { format, parseISO } from 'date-fns'

export default function Overview() {
  const { data: orders, loading: loadingOrders } = useAirtable('Orders')
  const { data: buyers, loading: loadingBuyers } = useAirtable('Buyers')
  const { data: chats, loading: loadingChats } = useAirtable('Chats')
  const { data: followups, loading: loadingFollowups } = useAirtable('Followups')
  const [insights, setInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  const loading = loadingOrders || loadingBuyers || loadingChats || loadingFollowups
  const metrics = useMetrics(orders, buyers, chats, followups)

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 10)

  const loadInsights = async () => {
    setInsightsLoading(true)
    try {
      const result = await getInsights({
        ordersToday: metrics.ordersToday,
        revenueToday: metrics.revenueToday,
        openChats: metrics.openChats,
        pendingFollowups: metrics.pendingFollowups,
        totalBuyers: buyers.length,
        churnRisk: metrics.churnRiskBuyers.length,
        topProducts: metrics.topProducts,
      })
      setInsights(result)
    } catch (err) {
      setInsights({ insights: ['Failed to load insights: ' + err.message], actions: [] })
    }
    setInsightsLoading(false)
  }

  const fmtRp = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`
  const fmtDate = (d) => {
    if (!d) return '—'
    try { return format(parseISO(d), 'dd MMM yyyy') } catch { return d }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Revenue Today" value={metrics.revenueToday} prefix="Rp " delta={metrics.revenueDelta} loading={loading} />
        <MetricCard label="Orders Today" value={metrics.ordersToday} delta={metrics.ordersDelta} loading={loading} />
        <MetricCard label="Open Chats" value={metrics.openChats} loading={loading} />
        <MetricCard label="Pending Follow-ups" value={metrics.pendingFollowups} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <RevenueChart data={metrics.last30Days} />
        <ProductChart data={metrics.topProducts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-bg-elevated border border-border rounded-md">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-label text-txt-secondary">Recent Orders</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[11px] text-txt-tertiary font-medium px-4 py-2">Order</th>
                  <th className="text-left text-[11px] text-txt-tertiary font-medium px-4 py-2">Buyer</th>
                  <th className="text-left text-[11px] text-txt-tertiary font-medium px-4 py-2">Date</th>
                  <th className="text-right text-[11px] text-txt-tertiary font-medium px-4 py-2">Total</th>
                  <th className="text-left text-[11px] text-txt-tertiary font-medium px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0 animate-pulse">
                      <td className="px-4 py-2.5"><div className="h-3 w-16 bg-bg-surface rounded" /></td>
                      <td className="px-4 py-2.5"><div className="h-3 w-24 bg-bg-surface rounded" /></td>
                      <td className="px-4 py-2.5"><div className="h-3 w-20 bg-bg-surface rounded" /></td>
                      <td className="px-4 py-2.5"><div className="h-3 w-20 bg-bg-surface rounded" /></td>
                      <td className="px-4 py-2.5"><div className="h-3 w-16 bg-bg-surface rounded" /></td>
                    </tr>
                  ))
                ) : recentOrders.length === 0 ? (
                  <tr><td colSpan="5" className="px-4 py-6 text-center text-txt-tertiary text-[13px]">No orders yet</td></tr>
                ) : recentOrders.map((o, i) => (
                  <tr key={o.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-bg-surface/30'}`}>
                    <td className="px-4 py-2 text-[13px] text-txt-primary font-medium">{o.order_id || o.id?.slice(-6)}</td>
                    <td className="px-4 py-2 text-[13px] text-txt-secondary">{o.buyer_id || '—'}</td>
                    <td className="px-4 py-2 text-[13px] text-txt-secondary">{fmtDate(o.date)}</td>
                    <td className="px-4 py-2 text-[13px] text-txt-primary text-right">{fmtRp(o.total)}</td>
                    <td className="px-4 py-2"><Badge>{o.status || 'pending'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-bg-elevated border border-border rounded-md">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-label text-txt-secondary">Churn Risk Alerts</span>
            <span className="text-[11px] text-danger font-medium">{metrics.churnRiskBuyers.length} flagged</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 border-b border-border last:border-0 animate-pulse">
                  <div className="h-3 w-32 bg-bg-surface rounded mb-2" />
                  <div className="h-3 w-20 bg-bg-surface rounded" />
                </div>
              ))
            ) : metrics.churnRiskBuyers.length === 0 ? (
              <div className="px-4 py-6 text-center text-txt-tertiary text-[13px]">No churn risks detected</div>
            ) : metrics.churnRiskBuyers.map(b => (
              <div key={b.id} className="px-4 py-3 border-b border-border last:border-0 flex items-center justify-between">
                <div>
                  <div className="text-[13px] text-txt-primary font-medium">{b.name}</div>
                  <div className="text-[11px] text-txt-tertiary">{b.company || 'No company'} · Last order: {fmtDate(b.last_order)}</div>
                </div>
                <Badge variant="danger">Churn Risk</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-bg-elevated border border-border rounded-md">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-label text-txt-secondary">AI Insights</span>
          <button
            onClick={loadInsights}
            disabled={insightsLoading}
            className="px-3 py-1.5 text-[12px] font-medium bg-accent-primary text-white rounded-md hover:bg-accent-secondary transition-colors disabled:opacity-50"
          >
            {insightsLoading ? 'Generating...' : 'Generate Insights'}
          </button>
        </div>
        <div className="p-4">
          {!insights ? (
            <div className="text-[13px] text-txt-tertiary text-center py-4">Click "Generate Insights" to get AI-powered analysis</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="text-[12px] text-txt-tertiary uppercase tracking-wide mb-2">Insights</div>
                <div className="space-y-2">
                  {(insights.insights || []).map((item, i) => (
                    <div key={i} className="flex gap-2 text-[13px] text-txt-secondary">
                      <span className="text-accent-secondary mt-0.5">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-txt-tertiary uppercase tracking-wide mb-2">Recommended Actions</div>
                <div className="space-y-2">
                  {(insights.actions || []).map((item, i) => (
                    <div key={i} className="flex gap-2 text-[13px] text-txt-secondary">
                      <span className="text-warning mt-0.5">→</span>
                      <span>{item}</span>
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
