'use client';

/**
 * StoryEditModal - Comprehensive story editing interface
 *
 * Allows Quark and Riker to manage:
 * - Story details (title, description, type, priority)
 * - Time estimates and scheduling
 * - Cost/budget parameters
 * - Acceptance criteria
 * - Crew assignment
 */

import React, { useState, useEffect } from 'react';
import type { Story, StoryWithDetails, CrewMember, StoryType, StoryStatus, EstimationResult } from '@/types/sprint';
import { CREW_MEMBERS, getPriorityValue, calculateStoryROI } from '@/types/sprint';
import { getEstimationRecommendation, calculateDurationDays } from '@/utils/story-estimation';
import styles from './StoryEditModal.module.css';

export interface StoryEditModalProps {
  story: StoryWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Story>) => Promise<void>;
  sprintStartDate: string;
  sprintEndDate: string;
}

export default function StoryEditModal({
  story,
  isOpen,
  onClose,
  onSave,
  sprintStartDate,
  sprintEndDate
}: StoryEditModalProps) {
  const [formData, setFormData] = useState({
    title: story.title,
    description: story.description || '',
    story_type: story.story_type,
    status: story.status,
    story_points: story.story_points || 0,
    priority: getPriorityValue(story.priority),
    assigned_crew_member: story.assigned_crew_member || '',
    start_date: story.start_date || '',
    estimated_completion: story.estimated_completion || '',
    estimated_hours: story.estimated_hours || 0,
    cost_estimate: 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timing' | 'cost'>('details');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: story.title,
        description: story.description || '',
        story_type: story.story_type,
        status: story.status,
        story_points: story.story_points || 0,
        priority: getPriorityValue(story.priority),
        assigned_crew_member: story.assigned_crew_member || '',
        start_date: story.start_date || '',
        estimated_completion: story.estimated_completion || '',
        estimated_hours: story.estimated_hours || 0,
        cost_estimate: 0,
      });
    }
  }, [isOpen, story]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave({
        title: formData.title,
        description: formData.description,
        story_type: formData.story_type,
        status: formData.status,
        story_points: formData.story_points,
        priority: formData.priority,
        assigned_crew_member: formData.assigned_crew_member || undefined,
        start_date: formData.start_date || undefined,
        estimated_completion: formData.estimated_completion || undefined,
        estimated_hours: formData.estimated_hours || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save story:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate estimates when story points or crew changes
      if (field === 'story_points' || field === 'assigned_crew_member' || field === 'story_type') {
        const estimation = getEstimationRecommendation(
          field === 'story_points' ? value : updated.story_points,
          field === 'story_type' ? value : updated.story_type,
          updated.priority,
          field === 'assigned_crew_member' ? (value || undefined) : (updated.assigned_crew_member || undefined) as CrewMember
        ) as EstimationResult;

        updated.estimated_hours = estimation.estimatedHours;
        updated.cost_estimate = estimation.estimatedCost;

        // Auto-calculate end date if start date is set
        if (updated.start_date && estimation.estimatedHours > 0) {
          const durationDays = calculateDurationDays(estimation.estimatedHours);
          const startDate = new Date(updated.start_date);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + durationDays - 1);
          updated.estimated_completion = endDate.toISOString().split('T')[0];
        }
      }

      return updated;
    });
  };

  const getCrewInfo = (crewId: string) => {
    return CREW_MEMBERS[crewId as CrewMember] || { name: 'Unassigned', specialty: '' };
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.storyId}>Story #{story.id?.slice(0, 8)}</div>
            <h2 className={styles.title}>Edit Story</h2>
            <p className={styles.subtitle}>
              {formData.assigned_crew_member && getCrewInfo(formData.assigned_crew_member).name} • {formData.story_points} pts
            </p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📝 Details
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'timing' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('timing')}
          >
            ⏱️ Timing (Riker)
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'cost' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('cost')}
          >
            💰 Cost (Quark)
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className={styles.section}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Story Title *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    placeholder="As a [user], I want [feature] so that [benefit]..."
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Story Type</label>
                    <select
                      className={styles.select}
                      value={formData.story_type}
                      onChange={(e) => handleChange('story_type', e.target.value as StoryType)}
                    >
                      <option value="user_story">User Story</option>
                      <option value="developer_story">Developer Story</option>
                      <option value="technical_task">Technical Task</option>
                      <option value="bug_fix">Bug Fix</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Status</label>
                    <select
                      className={styles.select}
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value as StoryStatus)}
                    >
                      <option value="backlog">Backlog</option>
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Story Points</label>
                    <select
                      className={styles.select}
                      value={formData.story_points}
                      onChange={(e) => handleChange('story_points', parseInt(e.target.value))}
                    >
                      <option value="0">0 (Unestimated)</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="5">5</option>
                      <option value="8">8</option>
                      <option value="13">13</option>
                      <option value="21">21</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Priority</label>
                    <select
                      className={styles.select}
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', getPriorityValue(e.target.value))}
                    >
                      <option value="1">1 - Critical</option>
                      <option value="2">2 - High</option>
                      <option value="3">3 - Medium</option>
                      <option value="4">4 - Low</option>
                      <option value="5">5 - Lowest</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Assigned Crew Member</label>
                  <select
                    className={styles.select}
                    value={formData.assigned_crew_member}
                    onChange={(e) => handleChange('assigned_crew_member', e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {Object.entries(CREW_MEMBERS).map(([id, info]) => (
                      <option key={id} value={id}>
                        {info.name} - {info.specialty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Timing Tab (Riker's Domain) */}
            {activeTab === 'timing' && (
              <div className={styles.section}>
                <div className={styles.tabHeader}>
                  <h3>⚡ Timeline Management</h3>
                  <p className={styles.tabSubtitle}>Commander Riker's execution planning</p>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Start Date</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={formData.start_date}
                      onChange={(e) => handleChange('start_date', e.target.value)}
                      min={sprintStartDate}
                      max={sprintEndDate}
                    />
                    <p className={styles.helpText}>When work begins on this story</p>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Estimated Completion Date</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={formData.estimated_completion}
                      onChange={(e) => handleChange('estimated_completion', e.target.value)}
                      min={formData.start_date || sprintStartDate}
                      max={sprintEndDate}
                    />
                    <p className={styles.helpText}>When work should be completed</p>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Estimated Hours</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.estimated_hours}
                    onChange={(e) => handleChange('estimated_hours', parseFloat(e.target.value))}
                    min="0"
                    step="0.5"
                    readOnly
                  />
                  <p className={styles.helpText}>
                    Auto-calculated by Commander Data based on {formData.story_points} story points
                    {formData.assigned_crew_member && ` and ${CREW_MEMBERS[formData.assigned_crew_member as CrewMember]?.name}'s efficiency`}
                  </p>
                </div>

                {formData.start_date && formData.estimated_completion && (
                  <div className={styles.infoBox}>
                    <div className={styles.infoIcon}>📊</div>
                    <div>
                      <strong>Duration Calculated</strong>
                      <p>
                        {Math.ceil((new Date(formData.estimated_completion).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                        {formData.estimated_hours > 0 && ` (${(formData.estimated_hours / Math.max(1, Math.ceil((new Date(formData.estimated_completion).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1)}h per day)`}
                      </p>
                    </div>
                  </div>
                )}

                <div className={styles.infoBox}>
                  <div className={styles.infoIcon}>ℹ️</div>
                  <div>
                    <strong>Riker's Execution Framework</strong>
                    <p>Set realistic timelines based on story points and team capacity. Coordinate dependencies and ensure sequential work flows smoothly.</p>
                  </div>
                </div>

                {formData.story_points > 0 && (
                  <div className={styles.estimateCard}>
                    <h4>Velocity Calculation</h4>
                    <div className={styles.calculation}>
                      <div className={styles.calcRow}>
                        <span>Story Points:</span>
                        <span className={styles.calcValue}>{formData.story_points}</span>
                      </div>
                      <div className={styles.calcRow}>
                        <span>Estimated Hours/Point:</span>
                        <span className={styles.calcValue}>
                          {formData.estimated_hours > 0 ? (formData.estimated_hours / formData.story_points).toFixed(1) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cost Tab (Quark's Domain) */}
            {activeTab === 'cost' && (
              <div className={styles.section}>
                <div className={styles.tabHeader}>
                  <h3>💰 Financial Analysis</h3>
                  <p className={styles.tabSubtitle}>Quark's business optimization</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Cost Estimate (GPL)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.cost_estimate}
                    onChange={(e) => handleChange('cost_estimate', parseFloat(e.target.value))}
                    min="0"
                    step="10"
                    readOnly
                  />
                  <p className={styles.helpText}>
                    Auto-calculated by Quark: {formData.estimated_hours}h × crew hourly rate
                    {formData.assigned_crew_member && ` (${CREW_MEMBERS[formData.assigned_crew_member as CrewMember]?.name})`}
                  </p>
                </div>

                {formData.story_points > 0 && (
                  <div className={styles.infoBox} style={{ background: 'rgba(255, 209, 102, 0.1)', borderColor: 'rgba(255, 209, 102, 0.3)' }}>
                    <div className={styles.infoIcon}>🎯</div>
                    <div>
                      <strong>Quark's Recommendation</strong>
                      <p>
                        {(() => {
                          const estimation = getEstimationRecommendation(
                            formData.story_points,
                            formData.story_type,
                            formData.priority,
                            formData.assigned_crew_member as CrewMember
                          );
                          return estimation.recommendation;
                        })()}
                      </p>
                    </div>
                  </div>
                )}

                <div className={styles.infoBox}>
                  <div className={styles.infoIcon}>💎</div>
                  <div>
                    <strong>Quark's ROI Framework</strong>
                    <p>Calculate return on investment by balancing cost against value delivery. Higher priority stories should justify their expense.</p>
                  </div>
                </div>

                {formData.story_points > 0 && formData.cost_estimate > 0 && (
                  <div className={styles.estimateCard}>
                    <h4>ROI Analysis (Quark's Formula)</h4>
                    <div className={styles.calculation}>
                      <div className={styles.calcRow}>
                        <span>Cost per Story Point:</span>
                        <span className={styles.calcValue}>
                          {(formData.cost_estimate / formData.story_points).toFixed(1)} GPL
                        </span>
                      </div>
                      <div className={styles.calcRow}>
                        <span>Priority Weight:</span>
                        <span className={styles.calcValue}>{6 - formData.priority}/5</span>
                      </div>
                      <div className={styles.calcRow}>
                        <span>ROI Score:</span>
                        <span className={styles.calcValue}>
                          {(() => {
                            const estimation = getEstimationRecommendation(
                              formData.story_points,
                              formData.story_type,
                              formData.priority,
                              formData.assigned_crew_member as CrewMember
                            );
                            return estimation.roiScore;
                          })()}/100
                        </span>
                      </div>
                      <div className={styles.calcRow}>
                        <span>Estimated Hours:</span>
                        <span className={styles.calcValue}>{formData.estimated_hours}h</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.buttonPrimary}
              disabled={isSaving || !formData.title}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
