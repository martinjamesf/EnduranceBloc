import { useState } from 'react'
import type { BlockTemplate, BlockConflict } from '@/lib/types'
import type { CalendarEvent } from '@/lib/services/calendarService'
import { applyTemplatesToRange } from '@/lib/services/blockTemplateService'

export function useApplyTemplates() {
  const [applying, setApplying] = useState(false)
  const [conflicts, setConflicts] = useState<BlockConflict[]>([])
  const [lastApplied, setLastApplied] = useState<CalendarEvent[]>([])

  const applyTemplates = async (
    templates: BlockTemplate[],
    startDate: Date,
    endDate: Date,
    profileId: string,
    existingEvents: CalendarEvent[]
  ) => {
    setApplying(true)
    setConflicts([])
    
    try {
      const result = await applyTemplatesToRange(
        templates,
        startDate,
        endDate,
        profileId,
        existingEvents
      )

      setConflicts(result.conflicts)
      setLastApplied(result.created)

      return {
        success: result.created.length > 0,
        created: result.created,
        conflicts: result.conflicts,
      }
    } catch (error) {
      console.error('Error applying templates:', error)
      throw error
    } finally {
      setApplying(false)
    }
  }

  const clearConflicts = () => {
    setConflicts([])
  }

  return {
    applying,
    conflicts,
    lastApplied,
    applyTemplates,
    clearConflicts,
  }
}
