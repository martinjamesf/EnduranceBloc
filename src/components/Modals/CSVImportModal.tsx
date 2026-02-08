'use client'

import { useState, useRef, useMemo } from 'react'
import { parseWorkoutCSV, generateCSVTemplate } from '@/lib/utils/csvParser'
import type { Workout } from '@/lib/types'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  /**
   * Optional callback invoked after a successful enqueue so the parent can refresh data.
   * LLM/Supabase ingestion happens inside this modal.
   */
  onImport?: () => Promise<void>
}

export default function CSVImportModal({
  isOpen,
  onClose,
  onImport
}: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Workout[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [useLLMNormalization, setUseLLMNormalization] = useState(true)
  const [importResults, setImportResults] = useState<
    { name: string; status: 'pending' | 'success' | 'error'; message?: string }
  >([])
  const [importSummary, setImportSummary] = useState<
    { total: number; succeeded: number; failed: number } | null
  >(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const fileName = selectedFile.name
    const isFIT = /\.fit(\.(gz|gzip))?$/i.test(fileName)
    const isCSV = /\.csv$/i.test(fileName)
    const isCSVGzip = /\.csv\.(gz|gzip)$/i.test(fileName)
    const isGZIP = isCSVGzip

    if (isFIT) {
      setFile(null)
      setPreview([])
      setError('FIT/GPX files are not supported here. Please export a CSV (can be .csv or .csv.gz).')
      return
    }

    if (!isCSV && !isCSVGzip) {
      setFile(null)
      setPreview([])
      setError('Please select a workout CSV file (.csv or .csv.gz). FIT/GPX exports are not supported.')
      return
    }

    setFile(selectedFile)
    setError(null)
    setImportResults([])
    setImportSummary(null)

    try {
      let text: string

      if (isGZIP) {
        // Decompress GZIP file
        const arrayBuffer = await selectedFile.arrayBuffer()
        const decompressed = await decompressGZIP(arrayBuffer)
        text = new TextDecoder().decode(decompressed)
      } else {
        text = await selectedFile.text()
      }

      const workouts = parseWorkoutCSV(text)
      
      if (workouts.length === 0) {
        setError('No valid workouts found in file')
        return
      }

      setPreview(workouts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
      setPreview([])
    }
  }

  // Decompress GZIP using native browser DecompressionStream API
  const decompressGZIP = async (buffer: ArrayBuffer): Promise<Uint8Array> => {
    try {
      const stream = new Response(buffer).body
      if (!stream) throw new Error('Failed to create stream')
      
      const decompressedStream = stream.pipeThrough(
        new DecompressionStream('gzip')
      )
      const decompressedResponse = new Response(decompressedStream)
      const decompressedBuffer = await decompressedResponse.arrayBuffer()
      return new Uint8Array(decompressedBuffer)
    } catch (err) {
      throw new Error('Failed to decompress GZIP file. Make sure the file is a valid GZIP archive.')
    }
  }

  const detectProvider = (fileName?: string | null) => {
    if (!fileName) return 'csv_import'
    const lower = fileName.toLowerCase()
    if (lower.includes('trainingpeaks')) return 'trainingpeaks'
    if (lower.includes('garmin')) return 'garmin'
    if (lower.includes('strava')) return 'strava'
    return 'csv_import'
  }

  const handleImport = async () => {
    if (preview.length === 0) return

    setImportResults([])
    setImportSummary(null)

    try {
      setImporting(true)

      const initialResults = preview.map((wo) => ({
        name: wo.title,
        status: 'pending' as const
      }))
      setImportResults(initialResults)

      const responses = await Promise.allSettled(
        preview.map(async (workout) => {
          const res = await fetch('/api/ingest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              source: useLLMNormalization ? 'csv_import_llm' : 'csv_import',
              payload: {
                file_name: file?.name,
                provider_hint: detectProvider(file?.name),
                workout,
                normalize_with_llm: useLLMNormalization,
                note: 'CSV import via CSVImportModal'
              }
            })
          })

          if (!res.ok) {
            const text = await res.text()
            throw new Error(text || 'Failed to enqueue translation job')
          }

          return res.json()
        })
      )

      let succeeded = 0
      let failed = 0

      const nextResults = responses.map((result, index) => {
        if (result.status === 'fulfilled') {
          succeeded += 1
          return { ...initialResults[index], status: 'success' as const }
        }

        failed += 1
        const message = result.reason instanceof Error
          ? result.reason.message
          : 'Failed to enqueue translation job'

        return { ...initialResults[index], status: 'error' as const, message }
      })

      setImportResults(nextResults)
      setImportSummary({ total: preview.length, succeeded, failed })

      if (failed === 0) {
        await onImport?.()
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate()
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'workout_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const successCount = useMemo(
    () => importResults.filter((r) => r.status === 'success').length,
    [importResults]
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-primary rounded-xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">📊 Import Workouts from CSV</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-blue-300 mb-2">How to export a workout CSV (TrainingPeaks, Garmin, Strava, etc.):</h3>
            <ol className="text-sm text-blue-200/80 space-y-1 list-decimal list-inside">
              <li>Export a CSV of your workouts (not FIT/GPX). CSV or CSV.GZ are both fine.</li>
              <li>Ensure the header row includes a date column and a name/title column. Helpful extras: type, duration, distance, TSS/score.</li>
              <li>If your export uses semicolons, keep them—parsing will auto-detect.</li>
              <li>Upload the .csv or .csv.gz file here. LLM normalization can fill gaps and map types.</li>
            </ol>
          </div>

          {/* Template Download + LLM toggle */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  id="llm-normalize"
                  type="checkbox"
                  checked={useLLMNormalization}
                  onChange={(e) => setUseLLMNormalization(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30 bg-transparent text-cadenceTeal"
                />
                <label htmlFor="llm-normalize" className="text-sm text-slate-200">
                  Use LLM normalization (fills gaps, maps types)
                </label>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition text-sm"
            >
              📥 Download Template
            </button>
          </div>

          {/* File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.csv.gz,.csv.gzip,.gz,.gzip"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-white/20 rounded-lg hover:border-cadenceTeal/50 hover:bg-white/5 transition text-center"
            >
              <div className="text-4xl mb-2">📁</div>
              <p className="text-white font-medium">
                {file ? file.name : 'Click to select a workout CSV'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Use CSV export (.csv or .csv.gz). FIT/GPX exports are not supported here.
              </p>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-300 text-sm">⚠️ {error}</p>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">
                  Preview ({preview.length} workouts)
                </h3>
                <div className="text-xs text-slate-400">
                  Supabase target with LLM-assisted normalization → translator_jobs queue
                </div>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {preview.map((wo, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{wo.title}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(wo.start).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            🏷️ {wo.source || 'csv_import'}
                          </span>
                          {wo.metadata?.tss !== undefined && <span>⚡ {wo.metadata.tss} TSS</span>}
                          {wo.metadata?.distance !== undefined && <span>📏 {wo.metadata.distance} km</span>}
                          {wo.metadata?.avgWatts !== undefined && <span>🚴 {wo.metadata.avgWatts} W</span>}
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        wo.type === 'swim' ? 'bg-blue-500/20 text-blue-300' :
                        wo.type === 'bike' ? 'bg-yellow-500/20 text-yellow-300' :
                        wo.type === 'run' ? 'bg-red-500/20 text-red-300' :
                        'bg-slate-500/20 text-slate-300'
                      }`}>
                        {wo.type.charAt(0).toUpperCase() + wo.type.slice(1)}
                      </span>
                    </div>

                    {importResults[i] && (
                      <div className="mt-2 text-xs">
                        {importResults[i].status === 'pending' && (
                          <span className="text-slate-400">Queued for Supabase…</span>
                        )}
                        {importResults[i].status === 'success' && (
                          <span className="text-cadenceTeal">✓ Enqueued</span>
                        )}
                        {importResults[i].status === 'error' && (
                          <span className="text-rose-400">⚠️ {importResults[i].message}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import summary */}
          {importSummary && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white flex items-center justify-between">
              <span>Queued {importSummary.total} workouts → Supabase translator pipeline</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-cadenceTeal">✓ {importSummary.succeeded} succeeded</span>
                {importSummary.failed > 0 && (
                  <span className="text-rose-400">⚠️ {importSummary.failed} failed</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <div className="flex flex-col items-end gap-1 text-xs text-slate-400 mr-auto">
            <span>Creates raw_workouts → translator_jobs with LLM fallback (if enabled)</span>
            {successCount > 0 && <span className="text-cadenceTeal">✓ {successCount} enqueued</span>}
          </div>
          <button
            onClick={handleImport}
            disabled={preview.length === 0 || importing}
            className="px-6 py-2 rounded-lg bg-secondary text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {importing ? 'Enqueuing…' : `Send ${preview.length} to Supabase`}
          </button>
        </div>
      </div>
    </div>
  )
}
