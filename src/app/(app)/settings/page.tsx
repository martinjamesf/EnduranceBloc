'use client'

import { usePageAnalytics } from '@/lib/analytics/usePageAnalytics'
import GoogleCalendarWidget from '@/components/Integrations/GoogleCalendarWidget'

export default function CalendarSyncSettings() {
  usePageAnalytics('settings')
  const today = new Date()
  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() + 6)

  return (
    <section className="p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Calendar Sync</h2>
        <p className="text-sm text-gray-400">Connect and manually sync Google Calendar events.</p>
      </div>

      <div className="border border-gray-700 rounded-lg p-4 bg-[#0c1824]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Google Calendar</p>
            <p className="text-xs text-gray-500">Manual sync. Resolver coming next.</p>
          </div>
          <GoogleCalendarWidget weekStart={today} weekEnd={weekEnd} />
        </div>
      </div>
    </section>
  )
}