import React from 'react'

const variants = {
  default: 'bg-bg-hover text-txt-secondary border border-border',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  accent: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
}

const statusMap = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'accent',
  delivered: 'success',
  cancelled: 'danger',
  paid: 'success',
  unpaid: 'warning',
  overdue: 'danger',
  prospect: 'default',
  lead: 'info',
  active: 'success',
  vip: 'accent',
  churned: 'danger',
  sent: 'info',
  opened: 'accent',
  done: 'success',
  skipped: 'default',
  interested: 'success',
  ordered: 'success',
  no_response: 'warning',
  not_interested: 'danger',
  awareness: 'default',
  interest: 'info',
  decision: 'warning',
  won: 'success',
  lost: 'danger',
  inbound: 'info',
  outbound: 'accent',
  inquiry: 'info',
  order: 'success',
  complaint: 'danger',
  followup: 'warning',
  other: 'default',
}

export default function Badge({ children, variant, status }) {
  const v = variant || statusMap[children?.toString().toLowerCase()] || statusMap[status] || 'default'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${variants[v]} transition-colors`}>
      {children}
    </span>
  )
}
