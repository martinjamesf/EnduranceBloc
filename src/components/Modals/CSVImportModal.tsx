'use client'

import { useState, useRef } from 'react'
import { parseTrainingPeaksCSV, generateCSVTemplate } from '@/lib/utils/csvParser'
import type { Workout } from '@/lib/types'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (workouts: Workout[]) => Promise<void>
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setError(null)

    try {
      const text = await selectedFile.text()
      const workouts = parseTrainingPeaksCSV(text)
      
      if (workouts.length === 0) {
        setError('No valid workouts found in CSV')
        return
      }

      setPreview(workouts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV')
      setPreview([])
    }
  }

  const handleImport = async () => {
    if (preview.length === 0) return

    try {
      setImporting(true)
      await onImport(preview)
      onClose()
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
    a.download = 'trainingpeaks_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#0D1D35] rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">📊 Import TrainingPeaks CSV</h2>
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
            <h3 className="font-semibold text-blue-300 mb-2">How to export from TrainingPeaks:</h3>
            <ol className="text-sm text-blue-200/80 space-y-1 list-decimal list-inside">
              <li>Go to TrainingPeaks.com → Calendar view</li>
              <li>Select the week you want to export</li>
              <li>Click "More" → "Export Workouts"</li>
              <li>Choose CSV format and download</li>
              <li>Upload the file here</li>
            </ol>
          </div>

          {/* Template Download */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Need a template?</p>
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
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-white/20 rounded-lg hover:border-cadenceTeal/50 hover:bg-white/5 transition text-center"
            >
              <div className="text-4xl mb-2">📁</div>
              <p className="text-white font-medium">
                {file ? file.name : 'Click to select CSV file'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                or drag and drop
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
            <div>
              <h3 className="font-semibold text-white mb-3">
                Preview ({preview.length} workouts)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {preview.slice(0, 5).map((wo, i) => (
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
                    {wo.metadata && (
                      <div className="flex gap-3 mt-2 text-xs text-slate-400">
                        {wo.metadata.tss && <span>⚡ {wo.metadata.tss} TSS</span>}
                        {wo.metadata.distance && <span>📏 {wo.metadata.distance}km</span>}
                      </div>
                    )}
                  </div>
                ))}
                {preview.length > 5 && (
                  <p className="text-sm text-slate-400 text-center py-2">
                    + {preview.length - 5} more workouts
                  </p>
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
          <button
            onClick={handleImport}
            disabled={preview.length === 0 || importing}
            className="px-6 py-2 rounded-lg bg-cadenceOrange text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {importing ? 'Importing...' : `Import ${preview.length} Workouts`}
          </button>
        </div>
      </div>
    </div>
  )
}
