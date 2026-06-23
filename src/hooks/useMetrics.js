import { useMemo } from 'react'
import { format, subDays, isToday, isYesterday, parseISO } from 'date-fns'

export function useMetrics(orders, buyers, chats, followups) {
  return useMemo(() => {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')

    const parseDate = (d) => {
      if (!d) return null
      try { return typeof d === 'string' ? parseISO(d) : new Date(d) } catch { return null }
    }

    const todayOrders = orders.filter(o => {
      const d = parseDate(o.date)
      return d && isToday(d)
    })

    const yesterdayOrders = orders.filter(o => {
      const d = parseDate(o.date)
      return d && isYesterday(d)
    })

    const revenueToday = todayOrders.reduce((s, o) => s + (o.total || 0), 0)
    const revenueYesterday = yesterdayOrders.reduce((s, o) => s + (o.total || 0), 0)
    const revenueDelta = revenueYesterday > 0
      ? ((revenueToday - revenueYesterday) / revenueYesterday * 100)
      : revenueToday > 0 ? 100 : 0

    const ordersToday = todayOrders.length
    const ordersYesterday = yesterdayOrders.length
    const ordersDelta = ordersYesterday > 0
      ? ((ordersToday - ordersYesterday) / ordersYesterday * 100)
      : ordersToday > 0 ? 100 : 0

    const openChats = chats.filter(c => !c.resolved).length
    const pendingFollowups = followups.filter(f => f.status === 'pending').length

    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0)
    const totalProfit = orders.reduce((s, o) => s + (o.profit || 0), 0)
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

    const churnRiskBuyers = buyers.filter(b => b.churn_risk)

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(today, 29 - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayOrders = orders.filter(o => {
        const d = parseDate(o.date)
        return d && format(d, 'yyyy-MM-dd') === dateStr
      })
      return {
        date: format(date, 'dd MMM'),
        revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
        orders: dayOrders.length,
      }
    })

    const productCounts = {}
    orders.forEach(o => {
      try {
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items
        if (Array.isArray(items)) {
          items.forEach(item => {
            const name = item.product || item.name || 'Unknown'
            productCounts[name] = (productCounts[name] || 0) + (item.qty || item.quantity || 1)
          })
        }
      } catch {}
    })
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    return {
      revenueToday,
      revenueDelta,
      ordersToday,
      ordersDelta,
      openChats,
      pendingFollowups,
      totalRevenue,
      totalProfit,
      avgOrderValue,
      churnRiskBuyers,
      last30Days,
      topProducts,
    }
  }, [orders, buyers, chats, followups])
}
