'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components'
import TaskCard from '@/components/Cards/TaskCard'
import TaskEditModal, { TaskEditFormData } from '@/components/Modals/TaskEditModal'
import GoogleCalendarWidget from '@/components/Integrations/GoogleCalendarWidget'
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

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const metadata = {
  title: 'Sunday Prep | EnduranceBloc',
  description: 'Plan your week with the Sunday Prep ritual'
}

export default function SundayPrep() {
  const [weekData, setWeekData] = useState<DayBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasHydrated, setHasHydrated] = useState(false)
  const [weekStart, setWeekStart] = useState<Date>(new Date())
  const [editingTask, setEditingTask] = useState<{ dayIndex: number; task: WorkoutBlock } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draggedTask, setDraggedTask] = useState<{ dayIndex: number; taskId: string } | null>(null)

  // Initialize week data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        const ws = getCurrentWeekStart()
        setWeekStart(ws)

        if (user) {
          const data = await loadWeekPlan(user.id, ws)
          setWeekData(data)
        } else {
          // Initialize empty week for guests
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
      await saveWeekPlan(user.id, weekData)
      setError(null)
    } catch (err) {
      console.error('Failed to save week:', err)
      setError('Failed to save week')
    } finally {
      setSaving(false)
    }
  }

  const handleDragStart = (dayIndex: number, taskId: string) => {
    setDraggedTask({ dayIndex, taskId })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDropTask = (targetDayIndex: number) => {
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
      <PageHeader
        title={formatWeekHeader(weekStart)}
        subtitle="Your 15-minute Sunday planning ritual"
      />

      {/* Action Bar */}
      <div className="px-4 md:px-8 py-6 flex items-center justify-between gap-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <GoogleCalendarWidget 
            weekStart={weekStart} 
            weekEnd={new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)} 
          />
          {error && (
            <div className="text-red-400 text-sm flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}
        </div>
        <button
          onClick={handleSaveWeek}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-[#FF7A00] text-white font-semibold hover:opacity-90 disabled:opacity-50 transition whitespace-nowrap"
        >
          {saving ? 'Saving...' : 'Save Week'}
        </button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-7 gap-4 px-4 md:px-8 pt-6">
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
              {/* LUNCH tag */}
              <div className="bg-white/10 py-1.5 px-2 rounded-lg flex items-center justify-center border border-white/10">
                <p className="font-semibold text-[10px] text-slate-300 tracking-widest uppercase">Lunch</p>
              </div>

              {/* Tasks Container */}
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {dayBlock.tasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => task.id && handleDragStart(dayIndex, task.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TaskCard
                      category={task.category}
                      title={task.title}
                      subtitle={task.subtitle}
                      onEdit={() => handleEditTask(dayIndex, task)}
                    />
                  </div>
                ))}
              </div>

              {/* Add Task Button */}
              <button
                onClick={() => handleAddTask(dayIndex)}
                className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-sm rounded-lg transition-colors border border-dashed border-white/20"
              >
                + Add Task
              </button>

              {/* BREAK tag */}
              <div className="bg-white/10 py-1.5 px-2 rounded-lg flex items-center justify-center border border-white/10">
                <p className="font-semibold text-[10px] text-slate-300 tracking-widest uppercase">Break</p>
              </div>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  )
}