const AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE_ID
const AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_API_KEY
const BASE_URL = 'https://api.airtable.com/v0'

const headers = () => ({
  Authorization: `Bearer ${AIRTABLE_KEY}`,
  'Content-Type': 'application/json',
})

export const fetchTable = async (table, params = {}) => {
  const url = new URL(`${BASE_URL}/${AIRTABLE_BASE}/${encodeURIComponent(table)}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))

  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${AIRTABLE_KEY}` } })
  if (!res.ok) throw new Error(`Airtable fetch failed: ${res.status}`)

  const data = await res.json()
  let records = data.records.map(r => ({ id: r.id, ...r.fields }))

  let offset = data.offset
  while (offset) {
    url.searchParams.set('offset', offset)
    const next = await fetch(url.toString(), { headers: { Authorization: `Bearer ${AIRTABLE_KEY}` } })
    const nextData = await next.json()
    records = records.concat(nextData.records.map(r => ({ id: r.id, ...r.fields })))
    offset = nextData.offset
  }

  return records
}

export const updateRecord = async (table, id, fields) => {
  const res = await fetch(`${BASE_URL}/${AIRTABLE_BASE}/${encodeURIComponent(table)}/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) throw new Error(`Airtable update failed: ${res.status}`)
  return res.json()
}

export const createRecord = async (table, fields) => {
  const res = await fetch(`${BASE_URL}/${AIRTABLE_BASE}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) throw new Error(`Airtable create failed: ${res.status}`)
  return res.json()
}

export const deleteRecord = async (table, id) => {
  const res = await fetch(`${BASE_URL}/${AIRTABLE_BASE}/${encodeURIComponent(table)}/${id}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) throw new Error(`Airtable delete failed: ${res.status}`)
  return res.json()
}
