import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchTable, updateRecord, createRecord, deleteRecord } from '../config/airtable'

export function useAirtable(table, params = {}, pollInterval = 30000) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const paramsRef = useRef(JSON.stringify(params))

  const load = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const records = await fetchTable(table, JSON.parse(paramsRef.current))
      setData(records)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [table])

  useEffect(() => {
    paramsRef.current = JSON.stringify(params)
  }, [params])

  useEffect(() => {
    load(true)
    if (pollInterval > 0) {
      const interval = setInterval(() => load(false), pollInterval)
      return () => clearInterval(interval)
    }
  }, [load, pollInterval])

  const update = useCallback(async (id, fields) => {
    await updateRecord(table, id, fields)
    setData(prev => prev.map(r => r.id === id ? { ...r, ...fields } : r))
  }, [table])

  const create = useCallback(async (fields) => {
    const result = await createRecord(table, fields)
    const newRecord = { id: result.id, ...result.fields }
    setData(prev => [newRecord, ...prev])
    return newRecord
  }, [table])

  const remove = useCallback(async (id) => {
    await deleteRecord(table, id)
    setData(prev => prev.filter(r => r.id !== id))
  }, [table])

  return { data, loading, error, refresh: () => load(true), update, create, remove }
}
