'use client'

import { useState, useEffect } from 'react'
import { isGoogleCalendarConnected, getGoogleCalendarAuthUrl, syncGoogleCalendarEvents } from '@/lib/integrations/googleCalendar'

interface GoogleCalendarWidgetProps {
  weekStart: Date
  weekEnd: Date
  onSync?: (success: boolean) => void
}

export default function GoogleCalendarWidget({ weekStart, weekEnd, onSync }: GoogleCalendarWidgetProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const connected = await isGoogleCalendarConnected()
      setIsConnected(connected)
    } catch (err) {
      console.error('Failed to check Google Calendar connection:', err)
    }
  }

  const handleConnect = () => {
    const authUrl = getGoogleCalendarAuthUrl()
    window.location.href = authUrl
  }

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    try {
      const weekEndDate = new Date(weekEnd)
      weekEndDate.setDate(weekEndDate.getDate() + 1) // Include full last day

      await syncGoogleCalendarEvents(weekStart, weekEndDate)
      onSync?.(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync'
      setError(message)
      onSync?.(false)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium text-sm rounded transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm.5-9H7v4.18l3.5 2.1.75-1.23-3.75-2.25V5z" />
            </svg>
            {isSyncing ? 'Syncing...' : 'Sync Calendar'}
          </button>
          {error && <span className="text-red-400 text-xs">{error}</span>}
        </>
      ) : (
        <button
          onClick={handleConnect}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 2H2C.9 2 0 2.9 0 4v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H2V5h12v9z" />
          </svg>
          Connect Google Calendar
        </button>
      )}
    </div>
  )
}
