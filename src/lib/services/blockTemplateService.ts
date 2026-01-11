import { supabase } from '../supabaseClient'
import type { BlockTemplate, BlockConflict, CalendarEvent } from '../types'

// Create block template
export async function createBlockTemplate(
  template: Omit<BlockTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  profileId: string
): Promise<BlockTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('block_templates')
      .insert({
        ...template,
        profile_id: profileId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating block template:', error)
      return null
    }

    return mapDbTemplateToBlockTemplate(data)
  } catch (error) {
    console.error('Error creating block template:', error)
    return null
  }
}

// Fetch all templates for a profile
export async function fetchBlockTemplates(profileId: string): Promise<BlockTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('block_templates')
      .select('*')
      .eq('profile_id', profileId)
      .order('name')

    if (error) {
      console.error('Error fetching block templates:', error)
      return []
    }

    return data.map(mapDbTemplateToBlockTemplate)
  } catch (error) {
    console.error('Error fetching block templates:', error)
    return []
  }
}

// Update block template
export async function updateBlockTemplate(
  templateId: string,
  updates: Partial<BlockTemplate>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('block_templates')
      .update({
        ...mapBlockTemplateToDb(updates as BlockTemplate),
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)

    if (error) {
      console.error('Error updating block template:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating block template:', error)
    return false
  }
}

// Delete block template
export async function deleteBlockTemplate(templateId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('block_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      console.error('Error deleting block template:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting block template:', error)
    return false
  }
}

// Apply templates to date range
export async function applyTemplatesToRange(
  templates: BlockTemplate[],
  startDate: Date,
  endDate: Date,
  profileId: string,
  existingEvents: CalendarEvent[]
): Promise<{ created: CalendarEvent[]; conflicts: BlockConflict[] }> {
  const created: CalendarEvent[] = []
  const conflicts: BlockConflict[] = []

  for (const template of templates) {
    if (!template.active) continue

    const dates = generateDatesFromRecurrence(template.recurrence, startDate, endDate)

    for (const date of dates) {
      const [startHour, startMinute] = template.defaultStart.split(':').map(Number)
      const [endHour, endMinute] = template.defaultEnd.split(':').map(Number)

      const blockStart = new Date(date)
      blockStart.setHours(startHour, startMinute, 0, 0)

      const blockEnd = new Date(date)
      blockEnd.setHours(endHour, endMinute, 0, 0)

      // Check constraints
      if (template.constraints) {
        const constraintViolation = checkConstraints(
          template.constraints,
          blockStart,
          blockEnd,
          existingEvents
        )

        if (constraintViolation) {
          conflicts.push({
            templateId: template.id,
            templateName: template.name,
            conflictingEventId: constraintViolation.eventId,
            conflictingEventTitle: constraintViolation.eventTitle,
            date: date.toISOString(),
            reason: constraintViolation.reason,
          })
          continue
        }
      }

      // Check for overlaps with existing events
      const overlap = findOverlap(blockStart, blockEnd, existingEvents)
      if (overlap) {
        conflicts.push({
          templateId: template.id,
          templateName: template.name,
          conflictingEventId: overlap.id,
          conflictingEventTitle: overlap.title,
          date: date.toISOString(),
          reason: 'Time slot already occupied',
        })
        continue
      }

      // Create block
      const newBlock: CalendarEvent = {
        id: `temp-${Date.now()}-${Math.random()}`,
        title: template.name,
        start: blockStart.toISOString(),
        end: blockEnd.toISOString(),
        type: 'block',
        description: template.description,
        category: template.category,
        color: template.color,
      }

      // Insert into database
      const { data, error } = await supabase
        .from('blocks')
        .insert({
          title: newBlock.title,
          start: newBlock.start,
          end: newBlock.end,
          profile_id: profileId,
          description: newBlock.description,
          category: template.category,
          color: template.color,
        })
        .select()
        .single()

      if (!error && data) {
        newBlock.id = data.id
        created.push(newBlock)
        existingEvents.push(newBlock) // Add to existing events to check future conflicts
      }
    }
  }

  return { created, conflicts }
}

// Helper: Generate dates from recurrence rule
function generateDatesFromRecurrence(
  recurrence: BlockTemplate['recurrence'],
  startDate: Date,
  endDate: Date
): Date[] {
  const dates: Date[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()

    // Check if this date should be skipped
    const dateStr = currentDate.toISOString().split('T')[0]
    if (recurrence.skipDates?.includes(dateStr)) {
      currentDate.setDate(currentDate.getDate() + 1)
      continue
    }

    // Check recurrence pattern
    let shouldInclude = false
    switch (recurrence.pattern) {
      case 'daily':
        shouldInclude = true
        break
      case 'weekdays':
        shouldInclude = dayOfWeek >= 1 && dayOfWeek <= 5
        break
      case 'weekends':
        shouldInclude = dayOfWeek === 0 || dayOfWeek === 6
        break
      case 'weekly':
      case 'custom':
        shouldInclude = recurrence.daysOfWeek?.includes(dayOfWeek) || false
        break
    }

    if (shouldInclude) {
      dates.push(new Date(currentDate))
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

// Helper: Check constraints
function checkConstraints(
  constraints: BlockTemplate['constraints'],
  blockStart: Date,
  blockEnd: Date,
  existingEvents: CalendarEvent[]
): { eventId: string; eventTitle: string; reason: string } | null {
  if (!constraints) return null

  const startTime = `${blockStart.getHours().toString().padStart(2, '0')}:${blockStart.getMinutes().toString().padStart(2, '0')}`
  const duration = (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60)

  // Check time constraints
  if (constraints.earliestStart && startTime < constraints.earliestStart) {
    return {
      eventId: '',
      eventTitle: '',
      reason: `Start time ${startTime} is before earliest allowed ${constraints.earliestStart}`,
    }
  }

  if (constraints.latestStart && startTime > constraints.latestStart) {
    return {
      eventId: '',
      eventTitle: '',
      reason: `Start time ${startTime} is after latest allowed ${constraints.latestStart}`,
    }
  }

  // Check duration constraints
  if (constraints.minDuration && duration < constraints.minDuration) {
    return {
      eventId: '',
      eventTitle: '',
      reason: `Duration ${duration}m is less than minimum ${constraints.minDuration}m`,
    }
  }

  if (constraints.maxDuration && duration > constraints.maxDuration) {
    return {
      eventId: '',
      eventTitle: '',
      reason: `Duration ${duration}m exceeds maximum ${constraints.maxDuration}m`,
    }
  }

  // Check category constraints
  if (constraints.mustNotOverlapWith && constraints.mustNotOverlapWith.length > 0) {
    const bufferStart = new Date(blockStart)
    const bufferEnd = new Date(blockEnd)

    if (constraints.bufferBefore) {
      bufferStart.setMinutes(bufferStart.getMinutes() - constraints.bufferBefore)
    }
    if (constraints.bufferAfter) {
      bufferEnd.setMinutes(bufferEnd.getMinutes() + constraints.bufferAfter)
    }

    for (const event of existingEvents) {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)

      const overlaps =
        (bufferStart >= eventStart && bufferStart < eventEnd) ||
        (bufferEnd > eventStart && bufferEnd <= eventEnd) ||
        (bufferStart <= eventStart && bufferEnd >= eventEnd)

      if (overlaps && event.category && constraints.mustNotOverlapWith.includes(event.category)) {
        return {
          eventId: event.id,
          eventTitle: event.title,
          reason: `Cannot overlap with ${event.category} category`,
        }
      }
    }
  }

  return null
}

// Helper: Find overlap with existing events
function findOverlap(
  blockStart: Date,
  blockEnd: Date,
  existingEvents: CalendarEvent[]
): CalendarEvent | null {
  for (const event of existingEvents) {
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)

    const overlaps =
      (blockStart >= eventStart && blockStart < eventEnd) ||
      (blockEnd > eventStart && blockEnd <= eventEnd) ||
      (blockStart <= eventStart && blockEnd >= eventEnd)

    if (overlaps) {
      return event
    }
  }

  return null
}

// Helper: Map database row to BlockTemplate
function mapDbTemplateToBlockTemplate(data: any): BlockTemplate {
  return {
    id: data.id,
    profileId: data.profile_id,
    name: data.name,
    category: data.category,
    color: data.color,
    defaultStart: data.default_start,
    defaultEnd: data.default_end,
    recurrence: data.recurrence,
    constraints: data.constraints,
    description: data.description,
    active: data.active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// Helper: Map BlockTemplate to database row
function mapBlockTemplateToDb(template: BlockTemplate): any {
  return {
    name: template.name,
    category: template.category,
    color: template.color,
    default_start: template.defaultStart,
    default_end: template.defaultEnd,
    recurrence: template.recurrence,
    constraints: template.constraints,
    description: template.description,
    active: template.active,
  }
}
