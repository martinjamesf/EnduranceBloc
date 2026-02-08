'use client'

import { useState, useEffect, useRef } from 'react'
import { usePageAnalytics } from '@/lib/analytics/usePageAnalytics'
import { SleepSettingsModal, AISuggestionsPanel, SundayPrepStepper, LayeredBlocksGuide } from '@/components'
import type { SundayPrepStep } from '@/components/SundayPrep/SundayPrepStepper'
import TaskEditModal, { TaskEditFormData } from '@/components/Modals/TaskEditModal'
import CSVImportModal from '@/components/Modals/CSVImportModal'
import { useAISuggestions } from '@/lib/hooks/useAISuggestions'
import { useTrainingPeaksSync } from '@/lib/hooks/useTrainingPeaksSync'
import { supabase } from '@/lib/supabaseClient'
import {
  loadWeekPlan,
  saveWeekPlan,
  getCurrentWeekStart,
  formatWeekHeader,
  createTask,
  updateTask,
  deleteTask,
  type DayBlock,
  type WorkoutBlock
} from '@/lib/services/sundayPrep'
import type { Workout } from '@/lib/types'

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SUNDAY_PREP_STEPS: SundayPrepStep[] = [
  { id: 'block-time', title: 'Block Time', description: 'Start with life anchors (family, work, recovery)' },
  { id: 'review-workouts', title: 'Review Workouts', description: 'Import or sync your training plan', optional: true },
  { id: 'schedule', title: 'Schedule Workouts', description: 'Place sessions on the grid' },
  { id: 'optimize', title: 'Review & Optimize', description: 'AI suggestions and conflict checks' },
  { id: 'finalize', title: 'Finalize & Commit', description: 'Save and confirm your plan' }
]

const STEP_HINTS = [
  '1) Block your foundation: add life, work, and recovery anchors first.',
  '2) Pull in your workouts for the upcoming week (or skip if unavailable).',
  '3) Drag workouts into open slots that respect your anchors.',
  '4) Run AI coach to optimize timing and resolve conflicts.',
  '5) Save your week and lock it in.'
]


export default function SundayPrep() {
  usePageAnalytics('sundayPrep')
  const [weekData, setWeekData] = useState<DayBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasHydrated, setHasHydrated] = useState(false)
  const [weekStart, setWeekStart] = useState<Date>(new Date())
  const [editingTask, setEditingTask] = useState<{ dayIndex: number; task: WorkoutBlock } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draggedTask, setDraggedTask] = useState<{ dayIndex: number; taskId: string } | null>(null)
  const [userSleepStart, setUserSleepStart] = useState(22)
  const [userSleepEnd, setUserSleepEnd] = useState(5)
  const [sleepSettingsOpen, setSleepSettingsOpen] = useState(false)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const aiAutoRanRef = useRef(false)
  const [draggedWorkout, setDraggedWorkout] = useState<Workout | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const stepId = SUNDAY_PREP_STEPS[stepIndex]?.id
  const showGrid = stepIndex >= 0 // Show grid from Step 1 (Block time)
  const showWorkoutsPanel = stepIndex >= 2 // Schedule onward
  const showAIStep = stepIndex >= 3 // Optimize and beyond
  const showFinalize = stepIndex >= 4 // Finalize
  const totalTasks = weekData.reduce((acc, day) => acc + day.tasks.length, 0)
  const fitnessTasks = weekData.reduce(
    (acc, day) => acc + day.tasks.filter(t => t.category === 'Fitness').length,
    0
  )
  const anchorTasks = totalTasks - fitnessTasks
  const unscheduledWorkouts = Math.max(0, (workouts?.length || 0) - fitnessTasks)

  // Persist step index locally so the ritual can be resumed quickly
  useEffect(() => {
    const savedStep = typeof window !== 'undefined' ? window.localStorage.getItem('sundayPrepStep') : null
    if (savedStep) {
      const parsed = Number(savedStep)
      if (!Number.isNaN(parsed)) {
        setStepIndex(Math.max(0, Math.min(parsed, SUNDAY_PREP_STEPS.length - 1)))
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sundayPrepStep', String(stepIndex))
    }
  }, [stepIndex])

  const handleQuickAddAnchor = (dayIndex: number, category: WorkoutBlock['category'], title: string) => {
    setEditingTask({
      dayIndex,
      task: {
        category,
        title,
        subtitle: undefined,
        notes: undefined,
        day_of_week: weekData[dayIndex].dayOfWeek,
        profile_id: undefined
      }
    })
  }

  // AI suggestions hook
  const { suggestions, loading: aiLoading, error: aiError, generateSuggestions } = useAISuggestions()
  
  // TrainingPeaks sync hook
  const { loading: tpSyncing, error: tpError, lastSyncedAt, syncedCount, sync: syncTrainingPeaks } = useTrainingPeaksSync()

  // Helpers to compute adjacent weeks
  const getPreviousWeekStart = (d: Date) => new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000)
  const getNextWeekStart = (d: Date) => new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000)

  const goToStep = (next: number) => {
    const clamped = Math.max(0, Math.min(next, SUNDAY_PREP_STEPS.length - 1))
    setStepIndex(clamped)
  }

  const handleNextStep = () => goToStep(stepIndex + 1)
  const handlePreviousStep = () => goToStep(stepIndex - 1)

  // Load week data for a given start date
  const loadWeekForDate = async (ws: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setWeekStart(ws)
      if (user) {
        const data = await loadWeekPlan(user.id, ws)
        setWeekData(data)
      } else {
        const emptyWeek: DayBlock[] = DAYS_OF_WEEK.map((day, i) => ({
          day,
          dayOfWeek: i + 1,
          tasks: []
        }))
        setWeekData(emptyWeek)
      }
    } catch (err) {
      console.error('Failed to load week data:', err)
      setError('Failed to load week data')
    }
  }

  // Initialize week data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const ws = getCurrentWeekStart()
        setWeekStart(ws)

        const { data: { user } } = await supabase.auth.getUser()
        setUserId(user?.id ?? null)
        
        if (!user) {
          // Initialize from localStorage if available for guests
          if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem('sundayPrepWeekData')
            if (stored) {
              try {
                const parsed = JSON.parse(stored) as DayBlock[]
                setWeekData(parsed)
                setLoading(false)
                setHasHydrated(true)
                return
              } catch (e) {
                console.warn('Failed to parse cached week data, using empty week')
              }
            }
          }
          const emptyWeek: DayBlock[] = DAYS_OF_WEEK.map((day, i) => ({
            day,
            dayOfWeek: i + 1,
            tasks: []
          }))
          setWeekData(emptyWeek)
          setLoading(false)
          setHasHydrated(true)
          return
        }

        // Load week plan and workouts in parallel for authenticated users
        const weekEnd = new Date(ws)
        weekEnd.setDate(weekEnd.getDate() + 7)

        const [weekPlanData, workoutsResult] = await Promise.all([
          loadWeekPlan(user.id, ws),
          supabase
            .from('workouts')
            .select('*')
            .eq('profile_id', user.id)
            .gte('start', ws.toISOString())
            .lt('start', weekEnd.toISOString())
            .order('start', { ascending: true })
        ])

        setWeekData(weekPlanData)

        if (workoutsResult.error) {
          console.error('Error loading workouts:', workoutsResult.error)
        } else if (workoutsResult.data) {
          setWorkouts(workoutsResult.data)
        }
      } catch (err) {
        console.error('Failed to load week data:', err)
        setError('Failed to load week data')
        // Set empty week on error
        const emptyWeek: DayBlock[] = DAYS_OF_WEEK.map((day, i) => ({
          day,
          dayOfWeek: i + 1,
          tasks: []
        }))
        setWeekData(emptyWeek)
      } finally {
        setLoading(false)
        setHasHydrated(true)
      }
    }

    loadInitialData()
  }, [])

  // Auto-run AI when entering optimize step if we haven't run it yet and have workouts
  useEffect(() => {
    if (stepId === 'optimize' && workouts.length > 0 && !aiAutoRanRef.current) {
      handleGenerateAI().catch(() => {})
    }
  }, [stepId, workouts.length])

  // Cache week data for guests so they can resume
  useEffect(() => {
    if (!hasHydrated) return
    if (userId) return // authenticated users persist via Supabase
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('sundayPrepWeekData', JSON.stringify(weekData))
    } catch (e) {
      console.warn('Failed to cache week data locally')
    }
  }, [weekData, hasHydrated, userId])

  const handleAddTask = async (dayIndex: number) => {
    const newTask: WorkoutBlock = {
      category: 'Work',
      title: 'New Task',
      day_of_week: weekData[dayIndex].dayOfWeek,
      profile_id: undefined
    }

    setEditingTask({ dayIndex, task: newTask })
  }

  const handleEditTask = (dayIndex: number, task: WorkoutBlock) => {
    setEditingTask({ dayIndex, task })
  }

  const handleSaveTask = async (updatedData: TaskEditFormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!editingTask) return

    try {
      setSaving(true)
      const dayIndex = editingTask.dayIndex
      const task = editingTask.task

      // If user is authenticated, save to Supabase
      if (user) {
        if (task.id) {
          // Update existing task
          await updateTask(task.id, {
            ...updatedData,
            day_of_week: weekData[dayIndex].dayOfWeek
          })
        } else {
          // Create new task
          await createTask(user.id, weekData[dayIndex].dayOfWeek, {
            ...updatedData,
            day_of_week: weekData[dayIndex].dayOfWeek
          })
        }

        // Reload week data from Supabase
        const updated = await loadWeekPlan(user.id, weekStart)
        setWeekData(updated)
      } else {
        // For unauthenticated users, just update local state
        const newTask: WorkoutBlock = {
          ...task,
          ...updatedData,
          day_of_week: weekData[dayIndex].dayOfWeek
        }

        // Update or insert in local state
        const newWeekData = [...weekData]
        if (task.id) {
          // Update existing
          newWeekData[dayIndex] = {
            ...newWeekData[dayIndex],
            tasks: newWeekData[dayIndex].tasks.map(t => t.id === task.id ? newTask : t)
          }
        } else {
          // Add new with temporary ID
          newTask.id = `temp-${Date.now()}`
          newWeekData[dayIndex] = {
            ...newWeekData[dayIndex],
            tasks: [...newWeekData[dayIndex].tasks, newTask]
          }
        }
        setWeekData(newWeekData)
      }

      setEditingTask(null)
      setError(null)
    } catch (err) {
      console.error('Failed to save task:', err)
      setError(`Failed to save task: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTask = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!editingTask?.task.id) return

    try {
      setSaving(true)
      
      if (user) {
        // Delete from Supabase
        await deleteTask(editingTask.task.id)
        const updated = await loadWeekPlan(user.id, weekStart)
        setWeekData(updated)
      } else {
        // Delete from local state
        const dayIndex = editingTask.dayIndex
        const taskId = editingTask.task.id
        const newWeekData = [...weekData]
        newWeekData[dayIndex] = {
          ...newWeekData[dayIndex],
          tasks: newWeekData[dayIndex].tasks.filter(t => t.id !== taskId)
        }
        setWeekData(newWeekData)
      }
      
      setEditingTask(null)
      setError(null)
    } catch (err) {
      console.error('Failed to delete task:', err)
      setError(`Failed to delete task: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWeek = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      setSaving(true)
      setSaveSuccess(false)
      await saveWeekPlan(user.id, weekData)
      setError(null)
      setSaveSuccess(true)
    } catch (err) {
      console.error('Failed to save week:', err)
      setError('Failed to save week')
      setSaveSuccess(false)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateAI = async () => {
    const allBlocks = weekData.flatMap(day => day.tasks)
    await generateSuggestions(workouts, allBlocks, weekStart)
    setShowAISuggestions(true)
    aiAutoRanRef.current = true
  }

  const handleSyncTrainingPeaks = async () => {
    try {
      await syncTrainingPeaks()
      setError(null)
      
      // Reload workouts after sync
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)

        const { data: workoutsData } = await supabase
          .from('workouts')
          .select('*')
          .eq('profile_id', user.id)
          .gte('start', weekStart.toISOString())
          .lt('start', weekEnd.toISOString())
          .order('start', { ascending: true })

        if (workoutsData) {
          setWorkouts(workoutsData)
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed'
      setError(errorMsg)
    }
  }

  const handleCSVImport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Reload workouts
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const { data: workoutsData, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('profile_id', user.id)
        .gte('start', weekStart.toISOString())
        .lt('start', weekEnd.toISOString())
        .order('start', { ascending: true })

      if (error) throw error

      if (workoutsData) {
        setWorkouts(workoutsData)
      }

      setShowCSVImport(false)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'CSV import failed'
      setError(errorMsg)
      throw err // Re-throw so modal can show error
    }
  }

  const handleApplySuggestion = async (workoutId: string, start: string, end: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .update({ start, end })
        .eq('id', workoutId)

      if (error) throw error

      // Refresh workouts
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)

        const { data: workoutsData } = await supabase
          .from('workouts')
          .select('*')
          .eq('profile_id', user.id)
          .gte('start', weekStart.toISOString())
          .lt('start', weekEnd.toISOString())
          .order('start', { ascending: true })

        if (workoutsData) {
          setWorkouts(workoutsData)
        }
      }
    } catch (err) {
      console.error('Failed to apply suggestion:', err)
      setError(`Failed to update workout: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleDragStart = (dayIndex: number, taskId: string) => {
    setDraggedTask({ dayIndex, taskId })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleScheduleWorkout = async (dayIndex: number, workout: Workout) => {
    const { data: { user } } = await supabase.auth.getUser()
    const baseTask: WorkoutBlock = {
      category: 'Fitness',
      title: workout.title || 'Workout',
      subtitle: workout.type ? workout.type.charAt(0).toUpperCase() + workout.type.slice(1) : undefined,
      notes: workout.notes,
      day_of_week: weekData[dayIndex].dayOfWeek,
      profile_id: user?.id
    }

    try {
      setSaving(true)
      if (user) {
        await createTask(user.id, weekData[dayIndex].dayOfWeek, baseTask)
        const updated = await loadWeekPlan(user.id, weekStart)
        setWeekData(updated)
      } else {
        const newTask: WorkoutBlock = {
          ...baseTask,
          id: `temp-${Date.now()}`
        }
        const newWeekData = [...weekData]
        newWeekData[dayIndex] = {
          ...newWeekData[dayIndex],
          tasks: [...newWeekData[dayIndex].tasks, newTask]
        }
        setWeekData(newWeekData)
      }
      setError(null)
    } catch (err) {
      console.error('Failed to schedule workout:', err)
      setError('Failed to schedule workout')
    } finally {
      setSaving(false)
    }
  }

  const handleDropTask = (targetDayIndex: number) => {
    if (draggedWorkout) {
      handleScheduleWorkout(targetDayIndex, draggedWorkout)
      setDraggedWorkout(null)
      return
    }

    if (!draggedTask) return

    const { dayIndex: sourceDayIndex, taskId } = draggedTask
    if (sourceDayIndex === targetDayIndex) {
      setDraggedTask(null)
      return
    }

    const sourceDay = weekData[sourceDayIndex]
    const taskToMove = sourceDay.tasks.find(t => t.id === taskId)

    if (taskToMove) {
      const newWeekData = [...weekData]
      newWeekData[sourceDayIndex] = {
        ...sourceDay,
        tasks: sourceDay.tasks.filter(t => t.id !== taskId)
      }

      const targetDay = newWeekData[targetDayIndex]
      newWeekData[targetDayIndex] = {
        ...targetDay,
        tasks: [...targetDay.tasks, { ...taskToMove, day_of_week: targetDay.dayOfWeek }]
      }

      setWeekData(newWeekData)
    }

    setDraggedTask(null)
  }

  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-300">Loading your week...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Page Header */}
      <div className="px-4 md:px-8 py-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Sunday Prep</h1>
              <p className="text-slate-400 mt-1">Week of {formatWeekHeader(weekStart)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadWeekForDate(getPreviousWeekStart(weekStart))}
                className="px-3 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition font-medium text-sm"
              >
                ← Previous
              </button>
              <button
                onClick={() => loadWeekForDate(getCurrentWeekStart())}
                className="px-3 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition font-medium text-sm"
              >
                Today
              </button>
              <button
                onClick={() => loadWeekForDate(getNextWeekStart(weekStart))}
                className="px-3 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition font-medium text-sm"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="px-4 md:px-8 pt-4">
        <div className="max-w-6xl mx-auto space-y-2">
          <SundayPrepStepper
            steps={SUNDAY_PREP_STEPS}
            currentStep={stepIndex}
            onStepChange={setStepIndex}
            onPrevious={handlePreviousStep}
            onNext={handleNextStep}
            disableNext={loading || saving}
            disablePrevious={loading || saving}
          />
          <p className="text-sm text-slate-400">{STEP_HINTS[stepIndex]}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 md:px-8 py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {error && (
            <div className="text-red-400 text-sm flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-3">
          <button
            onClick={() => setSleepSettingsOpen(true)}
            className="px-4 py-2.5 rounded-lg border border-white/20 text-white hover:bg-white/10 transition font-medium text-sm"
            title="Configure your sleep schedule"
          >
            ⚙️ Sleep Settings
          </button>
          <button
            onClick={() => setShowCSVImport(true)}
            className="px-4 py-2.5 rounded-lg border border-cadenceTeal/50 text-cadenceTeal hover:bg-cadenceTeal/10 transition font-medium text-sm"
            title="Import workouts from TrainingPeaks CSV export"
          >
            📥 Import CSV
          </button>
          <button
            onClick={handleSyncTrainingPeaks}
            disabled={tpSyncing}
            className="px-4 py-2.5 rounded-lg border border-cadenceTeal/50 text-cadenceTeal hover:bg-cadenceTeal/10 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
            title={tpError ? tpError : 'Sync workouts from TrainingPeaks for next week'}
          >
            {tpSyncing ? '🔄 Syncing...' : `📊 Sync TP${syncedCount > 0 ? ` (${syncedCount})` : ''}`}
          </button>
          <button
            onClick={handleGenerateAI}
            disabled={aiLoading || workouts.length === 0 || !showAIStep}
            className="px-4 py-2.5 rounded-lg border border-cadenceTeal/50 text-cadenceTeal hover:bg-cadenceTeal/10 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
            title={!showAIStep
              ? 'Reach Step 4 to use AI optimization'
              : workouts.length === 0
                ? 'Add workouts to get AI suggestions'
                : 'Get AI-powered workout timing suggestions'}
          >
            {aiLoading ? '✨ Analyzing...' : '✨ AI Coach'}
          </button>
          <button
            onClick={handleSaveWeek}
            disabled={saving || !showFinalize}
            className="px-6 py-2.5 rounded-lg bg-[#FF7A00] text-white font-semibold hover:opacity-90 disabled:opacity-50 transition whitespace-nowrap"
          >
            {saving ? 'Saving...' : showFinalize ? 'Save Week' : 'Finalize in Step 5'}
          </button>
        </div>
        </div>
      </div>

      {/* Step-specific guidance panels */}
      <div className="px-4 md:px-8 pt-4">
        <div className="max-w-6xl mx-auto space-y-3">
          {stepId === 'review-workouts' && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-white font-semibold">Step 2: Review your training plan <span className="text-xs text-slate-400">(optional)</span></p>
                <p className="text-slate-400 text-sm">Sync TrainingPeaks or import CSV. Skip if your coach hasn't uploaded this week's plan yet.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncTrainingPeaks}
                  disabled={tpSyncing}
                  className="px-4 py-2 rounded-lg border border-cadenceTeal/50 text-cadenceTeal hover:bg-cadenceTeal/10 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  {tpSyncing ? '🔄 Syncing...' : '📊 Sync TP'}
                </button>
                <button
                  onClick={() => setShowCSVImport(true)}
                  className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition text-sm"
                >
                  📥 Import CSV
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 rounded-lg bg-secondary text-white font-semibold hover:opacity-90 transition text-sm"
                >
                  Next: Schedule Workouts →
                </button>
              </div>
            </div>
          )}

          {stepId === 'block-time' && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-white font-semibold">Step 1: Block your foundation</p>
                <p className="text-slate-400 text-sm">Start with life anchors (family, work, recovery) before adding training. This ensures workouts fit around what matters most.</p>
              </div>
              
              {/* Layered Blocks Guide */}
              <LayeredBlocksGuide 
                daysOfWeek={DAYS_OF_WEEK}
                onAddBlock={handleQuickAddAnchor}
              />

              {/* Action Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 rounded-lg bg-secondary text-white font-semibold hover:opacity-90 transition text-sm"
                >
                  Next: Review Workouts →
                </button>
              </div>
            </div>
          )}

          {stepId === 'schedule' && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-white font-semibold">Step 3: Schedule workouts</p>
                <p className="text-slate-400 text-sm">Drag workouts into open slots that respect your anchors. Unscheduled: {unscheduledWorkouts}</p>
              </div>
              <button
                onClick={handleNextStep}
                className="px-4 py-2 rounded-lg bg-secondary text-white font-semibold hover:opacity-90 transition text-sm"
              >
                Next: Optimize →
              </button>
            </div>
          )}

          {stepId === 'optimize' && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-white font-semibold">Step 4: Review & optimize</p>
                <p className="text-slate-400 text-sm">Run AI Coach to spot conflicts and suggest better timing. Apply suggestions selectively.</p>
                {suggestions && suggestions.workoutSuggestions?.length > 0 && (
                  <p className="text-xs text-cadenceTeal">Suggestions ready: {suggestions.workoutSuggestions.length}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateAI}
                  disabled={aiLoading || workouts.length === 0}
                  className="px-4 py-2 rounded-lg border border-cadenceTeal/50 text-cadenceTeal hover:bg-cadenceTeal/10 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  {aiLoading ? '✨ Analyzing...' : '✨ Run AI Coach'}
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 rounded-lg bg-secondary text-white font-semibold hover:opacity-90 transition text-sm"
                >
                  Next: Finalize →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Week Grid */}
      {showGrid && (
        <div className="px-4 md:px-8 pt-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-7 gap-4">
              {weekData.map((dayBlock, dayIndex) => (
            <div
              key={dayBlock.day}
              className="flex flex-col min-h-[450px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDropTask(dayIndex)}
            >
              {/* Day Header */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-t-xl py-4 flex items-center justify-center">
                <h2 className="font-semibold text-lg text-white">{dayBlock.day}</h2>
              </div>

              {/* Day Column */}
              <div className="bg-white/5 backdrop-blur border border-t-0 border-white/10 rounded-b-xl p-4 flex flex-col gap-3 flex-1">
                {/* Events Container */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {dayBlock.tasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => task.id && handleDragStart(dayIndex, task.id)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <div
                        onClick={() => handleEditTask(dayIndex, task)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer group"
                      >
                        <p className="font-semibold text-sm text-white group-hover:text-blue-200 transition-colors">
                          {task.title}
                        </p>
                        {task.subtitle && (
                          <p className="text-xs text-slate-400 mt-1">{task.subtitle}</p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1.5 capitalize">
                          {task.category || 'Task'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Event Button */}
                <button
                  onClick={() => handleAddTask(dayIndex)}
                  className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-sm rounded-lg transition-colors border border-dashed border-white/20"
                >
                  + Add Event
                </button>

                {stepId === 'block-time' && (
                  <div className="grid grid-cols-3 gap-2 text-xs text-white">
                    <button
                      onClick={() => handleQuickAddAnchor(dayIndex, 'Work', 'Work block')}
                      className="px-2 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    >
                      + Work
                    </button>
                    <button
                      onClick={() => handleQuickAddAnchor(dayIndex, 'Family', 'Family time')}
                      className="px-2 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    >
                      + Family
                    </button>
                    <button
                      onClick={() => handleQuickAddAnchor(dayIndex, 'Sleep', 'Sleep anchor')}
                      className="px-2 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    >
                      + Sleep
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <TaskEditModal
          isOpen={true}
          taskId={editingTask.task.id || 'new'}
          initialData={{
            category: editingTask.task.category,
            title: editingTask.task.title,
            subtitle: editingTask.task.subtitle,
            notes: editingTask.task.notes
          }}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* TrainingPeaks Workouts Panel */}
      {showWorkoutsPanel && workouts.length > 0 && (
        <div className="px-4 md:px-8 py-8 border-t border-white/10">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">📊 TrainingPeaks Workouts</h2>
              <span className="text-sm text-slate-400">{workouts.length} workouts</span>
            </div>
            {stepId === 'schedule' && unscheduledWorkouts > 0 && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-200 flex items-center justify-between">
                <span>Unscheduled workouts: {unscheduledWorkouts}. Click “Add to day” to place them.</span>
                <span className="text-xs text-slate-400">Step 3 of 5</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workouts.map((wo) => (
                <div
                  key={wo.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cadenceTeal/50 transition"
                  draggable={stepId === 'schedule'}
                  onDragStart={() => stepId === 'schedule' && setDraggedWorkout(wo)}
                  onDragEnd={() => setDraggedWorkout(null)}
                >
                  {/* Workout Title and Type Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white flex-1">{wo.title}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                      wo.type === 'swim' ? 'bg-blue-500/20 text-blue-300' :
                      wo.type === 'bike' ? 'bg-yellow-500/20 text-yellow-300' :
                      wo.type === 'run' ? 'bg-red-500/20 text-red-300' :
                      'bg-slate-500/20 text-slate-300'
                    }`}>
                      {wo.type.charAt(0).toUpperCase() + wo.type.slice(1)}
                    </span>
                  </div>

                  {/* Time */}
                  <p className="text-sm text-slate-400 mt-2">
                    {new Date(wo.start).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                    {wo.end && (
                      <>
                        {' - '}
                        {new Date(wo.end).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </>
                    )}
                  </p>

                  {/* Notes */}
                  {wo.notes && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{wo.notes}</p>
                  )}

                  {/* Performance Metrics */}
                  {wo.metadata && Object.values(wo.metadata).some(v => v !== undefined) && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {wo.metadata.tss !== undefined && (
                          <div className="flex items-center gap-1 text-amber-400">
                            <span>⚡</span>
                            <span>{wo.metadata.tss} TSS</span>
                          </div>
                        )}
                        {wo.metadata.distance !== undefined && (
                          <div className="flex items-center gap-1 text-blue-400">
                            <span>📏</span>
                            <span>{wo.metadata.distance.toFixed(1)} km</span>
                          </div>
                        )}
                        {wo.metadata.avgWatts !== undefined && (
                          <div className="flex items-center gap-1 text-orange-400">
                            <span>⚙️</span>
                            <span>{wo.metadata.avgWatts}W avg</span>
                          </div>
                        )}
                        {wo.metadata.maxWatts !== undefined && (
                          <div className="flex items-center gap-1 text-red-400">
                            <span>🔥</span>
                            <span>{wo.metadata.maxWatts}W max</span>
                          </div>
                        )}
                        {wo.metadata.avgHr !== undefined && (
                          <div className="flex items-center gap-1 text-rose-400">
                            <span>❤️</span>
                            <span>{wo.metadata.avgHr} bpm avg</span>
                          </div>
                        )}
                        {wo.metadata.maxHr !== undefined && (
                          <div className="flex items-center gap-1 text-rose-500">
                            <span>💓</span>
                            <span>{wo.metadata.maxHr} bpm max</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Source Badge */}
                  {wo.source === 'trainingpeaks' && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="text-xs text-slate-500">📊 TrainingPeaks</span>
                    </div>
                  )}

                  {stepId === 'schedule' && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                      <span className="text-xs text-slate-400">Add to day:</span>
                      <div className="flex flex-wrap gap-1">
                        {weekData.map((day, idx) => (
                          <button
                            key={`${wo.id}-${day.day}`}
                            onClick={() => handleScheduleWorkout(idx, wo)}
                            className="px-2 py-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white"
                          >
                            {day.day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Sleep Settings Modal */}
      <SleepSettingsModal
        isOpen={sleepSettingsOpen}
        onClose={() => setSleepSettingsOpen(false)}
        sleepStart={userSleepStart}
        sleepEnd={userSleepEnd}
        onSave={(newStart, newEnd) => {
          setUserSleepStart(newStart)
          setUserSleepEnd(newEnd)
        }}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onImport={handleCSVImport}
      />

      {/* AI Suggestions Panel */}
      {showAIStep && showAISuggestions && (
        <div className="px-4 md:px-8 py-8 border-t border-white/10">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">✨ AI Coach Suggestions</h2>
              <button
                onClick={() => setShowAISuggestions(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            <AISuggestionsPanel
              suggestions={suggestions}
              loading={aiLoading}
              error={aiError}
              onApplySuggestion={handleApplySuggestion}
            />
          </div>
        </div>
      )}

      {showFinalize && (
        <div className="px-4 md:px-8 py-8 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">✅ Finalize & Commit</h2>
                <span className="text-sm text-slate-400">Step 5 of 5</span>
              </div>
              {saveSuccess && (
                <div className="rounded-lg border border-cadenceTeal/40 bg-cadenceTeal/10 text-cadenceTeal px-4 py-3 text-sm">
                  Week saved. You can still adjust and re-save anytime.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Total blocks</p>
                  <p className="text-2xl font-semibold text-white mt-1">{totalTasks}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Workouts scheduled</p>
                  <p className="text-2xl font-semibold text-white mt-1">{fitnessTasks}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Anchors (work/family/sleep)</p>
                  <p className="text-2xl font-semibold text-white mt-1">{anchorTasks}</p>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-semibold">Ready to save this week?</p>
                  <p className="text-slate-400 text-sm">Click "Save Week" in the action bar to lock it in.</p>
                </div>
                <button
                  onClick={handleSaveWeek}
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-secondary text-white font-semibold hover:opacity-90 disabled:opacity-50 transition text-sm"
                >
                  {saving ? 'Saving...' : 'Save Week'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}