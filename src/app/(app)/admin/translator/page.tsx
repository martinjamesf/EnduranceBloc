'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface DLQEntry {
  id: string
  raw_workout_id: string
  job_id: string
  error: string
  payload: any
  created_at: string
}

interface JobStats {
  pending: number
  processing: number
  succeeded: number
  failed: number
  dead_letter: number
}

export default function TranslatorAdminPage() {
  const [dlq, setDlq] = useState<DLQEntry[]>([])
  const [stats, setStats] = useState<JobStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000) // refresh every 10s
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      // Load DLQ entries
      const { data: dlqData } = await supabase
        .from('translator_dead_letter')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      setDlq(dlqData || [])

      // Load job stats
      const { data: jobsData } = await supabase.from('translator_jobs').select('status')
      const statsCounted: JobStats = {
        pending: 0,
        processing: 0,
        succeeded: 0,
        failed: 0,
        dead_letter: 0,
      }
      jobsData?.forEach((j) => {
        const s = j.status as keyof JobStats
        if (s in statsCounted) statsCounted[s]++
      })
      setStats(statsCounted)
    } catch (err) {
      console.error('Failed to load admin data', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Translator Pipeline Admin</h1>

      {/* Job Stats */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Job Statistics</h2>
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.processing}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.succeeded}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Succeeded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.failed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.dead_letter}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Dead Letter</div>
            </div>
          </div>
        )}
      </section>

      {/* Dead Letter Queue */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Dead Letter Queue (Last 50)</h2>
        {dlq.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No failed translations</p>
        ) : (
          <div className="space-y-4">
            {dlq.map((entry) => (
              <div key={entry.id} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                  <div className="text-xs font-mono text-gray-400">{entry.id.slice(0, 8)}</div>
                </div>
                <div className="text-red-600 font-semibold mb-2">{entry.error}</div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:underline">
                    View Payload
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                    {JSON.stringify(entry.payload, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
