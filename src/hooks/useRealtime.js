import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchTable } from '../config/airtable'

export function useRealtime(table, interval = 10000) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const records = await fetchTable(table)
      if (mountedRef.current) {
        setData(records)
        setLoading(false)
      }
    } catch {
      if (mountedRef.current) setLoading(false)
    }
  }, [table])

  useEffect(() => {
    mountedRef.current = true
    load()
    const timer = setInterval(load, interval)
    return () => {
      mountedRef.current = false
      clearInterval(timer)
    }
  }, [load, interval])

  return { data, loading }
}
