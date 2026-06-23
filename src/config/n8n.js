const SEND_WA_WEBHOOK = process.env.REACT_APP_N8N_SEND_WA_WEBHOOK
const FOLLOWUP_WEBHOOK = process.env.REACT_APP_N8N_FOLLOWUP_WEBHOOK

export const sendWhatsApp = async (phone, message) => {
  if (!SEND_WA_WEBHOOK) throw new Error('N8N Send WA webhook not configured')

  const res = await fetch(SEND_WA_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      message,
      timestamp: new Date().toISOString(),
    }),
  })

  if (!res.ok) throw new Error(`N8N webhook failed: ${res.status}`)
  return res.json()
}

export const triggerFollowup = async (buyerId, phone, message, scheduledDate) => {
  if (!FOLLOWUP_WEBHOOK) throw new Error('N8N Followup webhook not configured')

  const res = await fetch(FOLLOWUP_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyer_id: buyerId,
      phone,
      message,
      scheduled_date: scheduledDate,
      timestamp: new Date().toISOString(),
    }),
  })

  if (!res.ok) throw new Error(`N8N followup webhook failed: ${res.status}`)
  return res.json()
}
