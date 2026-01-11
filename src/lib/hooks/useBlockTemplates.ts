import { useState, useEffect } from 'react'
import type { BlockTemplate } from '@/lib/types'
import {
  fetchBlockTemplates,
  createBlockTemplate,
  updateBlockTemplate,
  deleteBlockTemplate,
} from '@/lib/services/blockTemplateService'

export function useBlockTemplates(profileId: string | null) {
  const [templates, setTemplates] = useState<BlockTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTemplates = async () => {
      if (!profileId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const fetchedTemplates = await fetchBlockTemplates(profileId)
        setTemplates(fetchedTemplates)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    }

    loadTemplates()
  }, [profileId])

  const createTemplate = async (
    template: Omit<BlockTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!profileId) {
      throw new Error('Must be logged in to create templates')
    }

    const newTemplate = await createBlockTemplate(template, profileId)
    if (newTemplate) {
      setTemplates(prev => [...prev, newTemplate])
      return newTemplate
    }
    throw new Error('Failed to create template')
  }

  const updateTemplate = async (templateId: string, updates: Partial<BlockTemplate>) => {
    const success = await updateBlockTemplate(templateId, updates)
    if (success) {
      setTemplates(prev =>
        prev.map(t => (t.id === templateId ? { ...t, ...updates } : t))
      )
      return true
    }
    throw new Error('Failed to update template')
  }

  const deleteTemplate = async (templateId: string) => {
    const success = await deleteBlockTemplate(templateId)
    if (success) {
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      return true
    }
    throw new Error('Failed to delete template')
  }

  const toggleTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    return updateTemplate(templateId, { active: !template.active })
  }

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplate,
  }
}
