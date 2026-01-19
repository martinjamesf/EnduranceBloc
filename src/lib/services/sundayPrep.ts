import { supabase } from '@/lib/supabaseClient'

export interface WorkoutBlock {
  id?: string
  profile_id?: string
  day_of_week: number
  start?: string
  end?: string
  category: 'Work' | 'Fitness' | 'Sleep' | 'Family' | 'Event'
  title: string
  subtitle?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface DayBlock {
  day: string
  dayOfWeek: number
  tasks: WorkoutBlock[]
}

export async function createTask(
  profileId: string,
  dayOfWeek: number,
  task: Omit<WorkoutBlock, 'id' | 'profile_id' | 'created_at' | 'updated_at'>
): Promise<WorkoutBlock> {
  try {
    const payload = {
      profile_id: profileId,
      day_of_week: dayOfWeek,
      category: task.category,
      title: task.title,
      subtitle: task.subtitle || null,
      notes: task.notes || null,
      start: task.start || null,
      end: task.end || null
    }

    const { data, error } = await supabase
      .from('blocks')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        payload
      })
      throw new Error(`Failed to create task: ${error.message}`)
    }
    return data
  } catch (err) {
    console.error('Failed to create task:', err instanceof Error ? err.message : err)
    throw err
  }
}

export async function updateTask(
  taskId: string,
  updates: Partial<WorkoutBlock>
): Promise<WorkoutBlock> {
  try {
    const { data, error } = await supabase
      .from('blocks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Failed to update task:', err)
    throw err
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
  } catch (err) {
    console.error('Failed to delete task:', err)
    throw err
  }
}

export async function loadWeekPlan(
  profileId: string,
  weekStart: Date
): Promise<DayBlock[]> {
  try {
    // OPTIMIZED: Single query to get all blocks for all days at once
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('profile_id', profileId)
      .in('day_of_week', [1, 2, 3, 4, 5, 6, 7])
      .order('start', { ascending: true })

    if (error) {
      console.error('Error loading blocks:', error.message || error)
      throw error
    }

    const tasks = (data || []) as WorkoutBlock[]

    // Group by day
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dayBlocks: DayBlock[] = dayNames.map((day, i) => ({
      day,
      dayOfWeek: i + 1,
      tasks: tasks.filter(t => t.day_of_week === (i + 1))
    }))

    return dayBlocks
  } catch (err) {
    console.error('Failed to load week plan:', err instanceof Error ? err.message : err)
    throw err
  }
}

export async function saveWeekPlan(
  profileId: string,
  dayBlocks: DayBlock[]
): Promise<void> {
  try {
    const allTasks: any[] = []
    
    dayBlocks.forEach(block => {
      block.tasks.forEach(task => {
        allTasks.push({
          id: task.id,
          profile_id: profileId,
          day_of_week: block.dayOfWeek,
          category: task.category,
          title: task.title,
          subtitle: task.subtitle || null,
          notes: task.notes || null,
          start: task.start || null,
          end: task.end || null
        })
      })
    })

    if (allTasks.length === 0) return

    const { error } = await supabase
      .from('blocks')
      .upsert(allTasks, { onConflict: 'id' })

    if (error) {
      console.error('Supabase upsert error:', {
        message: error.message,
        code: error.code,
        details: error.details
      })
      throw new Error(`Failed to save week plan: ${error.message}`)
    }
  } catch (err) {
    console.error('Failed to save week plan:', err instanceof Error ? err.message : err)
    throw err
  }
}

export function getCurrentWeekStart(): Date {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust to Monday
  const monday = new Date(today)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function formatWeekHeader(weekStart: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = monthNames[weekStart.getMonth()]
  const date = weekStart.getDate()
  const weekNumber = Math.ceil((date + new Date(weekStart.getFullYear(), 0, 1).getDay()) / 7)
  return `${month} Week ${weekNumber}`
}
