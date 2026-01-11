'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useBlockTemplates } from '@/lib/hooks/useBlockTemplates'
import { useApplyTemplates } from '@/lib/hooks/useApplyTemplates'
import { fetchCalendarEvents } from '@/lib/services/calendarService'
import { BlockTemplateList } from '@/components/BlockEditor/BlockTemplateList'
import { BlockTemplateForm } from '@/components/BlockEditor/BlockTemplateForm'
import { ApplyTemplatesPanel } from '@/components/BlockEditor/ApplyTemplatesPanel'
import { PageHeader } from '@/components'
import type { BlockTemplate, BlockCategory } from '@/lib/types'

export default function BlockEditorPage() {
  const [profileId, setProfileId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<BlockTemplate | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<BlockCategory | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const { templates, loading, createTemplate, updateTemplate, deleteTemplate, toggleTemplate } =
    useBlockTemplates(profileId)

  const { applying, applyTemplates } = useApplyTemplates()

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setProfileId(user?.id || null)
    }
    fetchUser()
  }, [])

  const handleSelectTemplate = (template: BlockTemplate) => {
    setSelectedTemplate(template)
    setShowForm(true)
  }

  const handleNewTemplate = () => {
    setSelectedTemplate(null)
    setShowForm(true)
  }

  const handleSaveTemplate = async (
    templateData: Omit<BlockTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (selectedTemplate) {
      await updateTemplate(selectedTemplate.id, templateData)
    } else {
      await createTemplate(templateData)
    }
    setShowForm(false)
    setSelectedTemplate(null)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setSelectedTemplate(null)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    await deleteTemplate(templateId)
    if (selectedTemplate?.id === templateId) {
      setShowForm(false)
      setSelectedTemplate(null)
    }
  }

  const handleApplyTemplates = async (
    selectedTemplates: BlockTemplate[],
    startDate: Date,
    endDate: Date
  ) => {
    if (!profileId) {
      throw new Error('Must be logged in to apply templates')
    }

    // Fetch existing events in the date range
    const existingEvents = await fetchCalendarEvents(
      startDate.toISOString(),
      endDate.toISOString(),
      profileId
    )

    return await applyTemplates(selectedTemplates, startDate, endDate, profileId, existingEvents)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <PageHeader
        dateDisplay="Block Editor"
        onTodayClick={() => {}}
        onPreviousClick={() => {}}
        onNextClick={() => {}}
        onToggleSidebar={() => {}}
        onAddEvent={handleNewTemplate}
        hideDateNav
      />

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left Panel: Template List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
              <button
                onClick={handleNewTemplate}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + New
              </button>
            </div>

            {/* Filters */}
            <div className="mb-4 space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as BlockCategory | 'all')}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="sleep">Sleep</option>
                  <option value="meal">Meal</option>
                  <option value="work">Work</option>
                  <option value="family">Family</option>
                  <option value="commute">Commute</option>
                  <option value="training">Training</option>
                  <option value="recovery">Recovery</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={activeFilter}
                  onChange={e => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading templates...</div>
            ) : (
              <BlockTemplateList
                templates={templates}
                selectedId={selectedTemplate?.id || null}
                onSelect={handleSelectTemplate}
                onToggle={toggleTemplate}
                onDelete={handleDeleteTemplate}
                categoryFilter={categoryFilter}
                activeFilter={activeFilter}
              />
            )}
          </div>

          {/* Middle Panel: Template Form (when editing) or Instructions */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6 overflow-y-auto">
            {showForm ? (
              <BlockTemplateForm
                template={selectedTemplate}
                onSave={handleSaveTemplate}
                onCancel={handleCancelForm}
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Welcome to Block Editor
                  </h2>
                  <p className="text-sm text-gray-600">
                    Create recurring templates for blocks of time like meals, sleep, work sessions,
                    and more. Once created, you can apply them to your calendar automatically.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Quick Start</h3>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Click "+ New" to create your first template</li>
                      <li>Set the name, category, and time range</li>
                      <li>Choose when it repeats (daily, weekdays, etc.)</li>
                      <li>Add constraints if needed (buffers, time limits)</li>
                      <li>Enable the template (toggle to "ON")</li>
                      <li>Apply templates using the panel on the right</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Features</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Recurring patterns (daily, weekdays, weekends, custom)</li>
                      <li>• Time constraints (earliest/latest start times)</li>
                      <li>• Buffers (add spacing before/after blocks)</li>
                      <li>• Category-based organization</li>
                      <li>• Conflict detection when applying</li>
                      <li>• Bulk apply to week/weekend/custom range</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">💡 Pro Tip</h3>
                    <p className="text-sm text-blue-800">
                      Create templates for your regular activities (sleep 10pm-6am, lunch 12-1pm,
                      commute 8-9am) and apply them weekly. The system will detect conflicts with
                      workouts and other events.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Apply Templates */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6 overflow-y-auto">
            <ApplyTemplatesPanel
              templates={templates}
              onApply={handleApplyTemplates}
              applying={applying}
            />
          </div>
        </div>
      </div>
    </div>
  )
}