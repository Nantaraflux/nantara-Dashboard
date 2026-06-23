import React from 'react'

const variants = {
  default: 'bg-bg-elevated text-txt-secondary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  info: 'bg-info/15 text-info',
  accent: 'bg-accent-primary/15 text-accent-secondary',
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide ${variants[v]}`}>
      {children}
    </span>
  )
}
