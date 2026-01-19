'use client'

import { useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'

interface SyncState {
  loading: boolean
  error: string | null
  lastSyncedAt: string | null
  syncedCount: number
}

export function useTrainingPeaksSync() {
  const [state, setState] = useState<SyncState>({
    loading: false,
    error: null,
    lastSyncedAt: null,
    syncedCount: 0,
  })

  const sync = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/trainingpeaks/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Sync failed with status ${response.status}`)
      }

      const data = await response.json()

      setState({
        loading: false,
        error: null,
        lastSyncedAt: data.lastSyncedAt || new Date().toISOString(),
        syncedCount: data.count || 0,
      })

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed'
      setState({
        loading: false,
        error: errorMessage,
        lastSyncedAt: state.lastSyncedAt,
        syncedCount: 0,
      })
      throw err
    }
  }, [state.lastSyncedAt])

  return {
    ...state,
    sync,
  }
}
