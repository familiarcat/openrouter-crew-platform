'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { UNIFIED_DOMAINS } from '@/lib/domains'
import { PROJECT_TEMPLATES, type ProjectTemplate } from '@/lib/unified-projects'
import { ClientTypes } from '@openrouter-crew/shared-schemas'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'

type Project = ClientTypes.Project

export default function NewProjectPage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    budget_usd: '',
    status: 'draft'
  })
  const [creating, setCreating] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          description: formData.description,
          type: formData.type || selectedTemplate?.type || 'custom',
          budget_usd: formData.budget_usd ? parseFloat(formData.budget_usd) : null,
          status: formData.status,
          total_cost_usd: 0
        } as any)
        .select()
        .single() as { data: Project | null; error: any }

      if (error) throw error

      if (data) {
        router.push(`/projects/${data.id}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  function selectTemplate(template: ProjectTemplate) {
    setSelectedTemplate(template)
    setSelectedDomain(template.domain_id)
    setFormData({
      ...formData,
      name: template.name,
      description: template.description,
      type: template.type,
      budget_usd: template.default_budget?.toString() || ''
    })
  }

  const domain = UNIFIED_DOMAINS.find(d => d.id === selectedDomain)

  return (
    <div className="grid">
      {/* Header */}
      <div className="card span-12">
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--muted)', marginBottom: 16, textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <h1 style={{ marginTop: 0, color: '#06b6d4' }}>✨ Create New Project</h1>
        <p className="small">
          Choose a template or start from scratch to create a new project in your unified platform.
        </p>
      </div>

      {/* Template Selection */}
      <div className="card span-12">
        <h2 style={{ marginTop: 0 }}>1. Choose a Template</h2>
        <p className="small" style={{ marginBottom: 16 }}>
          Select a template based on your domain or create a custom project
        </p>

        <div className="grid">
          {PROJECT_TEMPLATES.map((template) => {
            const templateDomain = UNIFIED_DOMAINS.find(d => d.id === template.domain_id)
            const isSelected = selectedTemplate?.name === template.name

            return (
              <div
                key={template.name}
                className="card span-6"
                style={{
                  cursor: 'pointer',
                  borderLeft: `3px solid ${templateDomain?.color}`,
                  background: isSelected
                    ? `linear-gradient(180deg, rgba(13,16,34,.9), rgba(11,15,29,.7)), radial-gradient(ellipse 400px 300px at 0% 0%, ${templateDomain?.color}30 0%, transparent 60%)`
                    : undefined,
                  borderColor: isSelected ? `${templateDomain?.color}80` : undefined
                }}
                onClick={() => selectTemplate(template)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, color: templateDomain?.color }}>{template.name}</h3>
                  {isSelected && (
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 12,
                      background: `${templateDomain?.color}40`,
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      <Check size={12} style={{ verticalAlign: 'middle' }} />
                    </div>
                  )}
                </div>

                <div className="small" style={{ marginBottom: 12, color: templateDomain?.color }}>
                  {templateDomain?.name}
                </div>

                <p className="small" style={{ marginBottom: 12, color: 'var(--muted)' }}>
                  {template.description}
                </p>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {template.features.map((feature) => (
                    <span key={feature} className="badge" style={{
                      background: `${templateDomain?.color}20`,
                      border: `1px solid ${templateDomain?.color}40`,
                      fontSize: 10
                    }}>
                      {feature}
                    </span>
                  ))}
                </div>

                {template.default_budget && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>Default Budget:</span>{' '}
                    <span style={{ fontWeight: 600 }}>${template.default_budget.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Project Details Form */}
      {selectedTemplate && (
        <div className="card span-12">
          <h2 style={{ marginTop: 0 }}>2. Project Details</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: 20, marginBottom: 24 }}>
              {/* Project Name */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    fontSize: 14
                  }}
                  placeholder="Enter project name"
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  placeholder="Describe your project..."
                />
              </div>

              {/* Domain & Type */}
              <div className="grid">
                <div className="span-6">
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                    Domain
                  </label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      fontSize: 14
                    }}
                  >
                    {UNIFIED_DOMAINS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {domain && (
                    <p className="small" style={{ marginTop: 8, color: domain.color }}>
                      {domain.description}
                    </p>
                  )}
                </div>

                <div className="span-6">
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                    Type
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      fontSize: 14
                    }}
                    placeholder="e.g., event-management, sprint-planning"
                  />
                </div>
              </div>

              {/* Budget & Status */}
              <div className="grid">
                <div className="span-6">
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                    Budget (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.budget_usd}
                    onChange={(e) => setFormData({ ...formData, budget_usd: e.target.value })}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      fontSize: 14
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div className="span-6">
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      fontSize: 14
                    }}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Link href="/">
                <button
                  type="button"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                disabled={creating || !formData.name}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: creating || !formData.name ? '#6b7280' : '#06b6d4',
                  color: 'white',
                  cursor: creating || !formData.name ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {creating ? (
                  <>
                    <Sparkles size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>Create Project</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Help Text */}
      {!selectedTemplate && (
        <div className="card span-12" style={{ background: 'var(--surface)', borderColor: 'var(--border-light)' }}>
          <p className="small" style={{ margin: 0, textAlign: 'center', color: 'var(--muted)' }}>
            👆 Select a template above to get started
          </p>
        </div>
      )}
    </div>
  )
}
