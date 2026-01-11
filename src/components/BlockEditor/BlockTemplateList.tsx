'use client'

import React from 'react'
import type { BlockTemplate, BlockCategory } from '@/lib/types'

interface BlockTemplateListProps {
  templates: BlockTemplate[]
  selectedId: string | null
  onSelect: (template: BlockTemplate) => void
  onToggle: (templateId: string) => void
  onDelete: (templateId: string) => void
  categoryFilter: BlockCategory | 'all'
  activeFilter: 'all' | 'active' | 'inactive'
}

const categoryColors: Record<BlockCategory, string> = {
  sleep: '#9B59B6',
  meal: '#E67E22',
  work: '#3498DB',
  family: '#E91E63',
  commute: '#95A5A6',
  training: '#2ECC71',
  recovery: '#1ABC9C',
  custom: '#7F8C8D',
}

const categoryLabels: Record<BlockCategory, string> = {
  sleep: 'Sleep',
  meal: 'Meal',
  work: 'Work',
  family: 'Family',
  commute: 'Commute',
  training: 'Training',
  recovery: 'Recovery',
  custom: 'Custom',
}

export function BlockTemplateList({
  templates,
  selectedId,
  onSelect,
  onToggle,
  onDelete,
  categoryFilter,
  activeFilter,
}: BlockTemplateListProps) {
  const filteredTemplates = templates.filter(template => {
    if (categoryFilter !== 'all' && template.category !== categoryFilter) {
      return false
    }
    if (activeFilter === 'active' && !template.active) {
      return false
    }
    if (activeFilter === 'inactive' && template.active) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-2">
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No templates found</p>
          <p className="text-sm mt-1">Create a new template to get started</p>
        </div>
      ) : (
        filteredTemplates.map(template => (
          <div
            key={template.id}
            className={`border rounded-lg p-3 cursor-pointer transition-all ${
              selectedId === template.id
                ? 'border-[#0c41ff] bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onSelect(template)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: template.color || categoryColors[template.category] }}
                  />
                  <h3 className="font-semibold text-sm text-gray-900 truncate">
                    {template.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100">
                    {categoryLabels[template.category]}
                  </span>
                  <span>
                    {template.defaultStart} - {template.defaultEnd}
                  </span>
                </div>
                {template.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {template.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onToggle(template.id)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    template.active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={template.active ? 'Active' : 'Inactive'}
                >
                  {template.active ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete template "${template.name}"?`)) {
                      onDelete(template.id)
                    }
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete template"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
