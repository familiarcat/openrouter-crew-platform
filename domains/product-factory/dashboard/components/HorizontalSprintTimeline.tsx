'use client';

/**
 * HorizontalSprintTimeline - Interactive horizontal timeline view
 *
 * Features a time-based horizontal layout showing:
 * - Story cards positioned by estimated completion date
 * - Crew member swim lanes
 * - Task dependencies as connecting lines
 * - Interactive drag-and-drop (future)
 * - Real-time progress tracking
 */

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Sprint, Story, StoryWithDetails, CrewMember } from '@/types/sprint';
import { CREW_MEMBERS, isHighPriority } from '@/types/sprint';
import styles from './HorizontalSprintTimeline.module.css';
import StoryEditModal from './StoryEditModal';
import StoryDurationBar from './StoryDurationBar';

export interface HorizontalSprintTimelineProps {
  projectId?: string;
  sprintId?: string;
  showAllSprints?: boolean;  // If true, shows all active sprints (for /sprints page)
}

interface SprintWithStories extends Sprint {
  stories: StoryWithDetails[];
}

interface TimelineDay {
  date: Date;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
}

export default function HorizontalSprintTimeline({
  projectId,
  sprintId,
  showAllSprints = false
}: HorizontalSprintTimelineProps) {
  const [sprints, setSprints] = useState<SprintWithStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSprints = async () => {
    console.log('[HorizontalSprintTimeline] Fetching sprints...', { projectId, sprintId, showAllSprints });
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (!showAllSprints && projectId) params.append('project_id', projectId);
      if (!showAllSprints && sprintId) params.append('sprint_id', sprintId);
      params.append('status', 'active');
      params.append('include_stories', 'true');

      const url = `/api/sprints?${params}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch sprints');

      const data = await response.json();
      const fetchedSprints = data.sprints || [];

      console.log(`[HorizontalSprintTimeline] ${fetchedSprints.length} sprint(s) loaded`);
      setSprints(fetchedSprints);
    } catch (err: any) {
      console.error('[HorizontalSprintTimeline] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprints();
  }, [projectId, sprintId, showAllSprints]);

  // Helper functions moved to SingleSprintView component

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span style={{ color: 'var(--muted)' }}>Loading sprint timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorTitle}>Error loading sprints</div>
          <div className={styles.errorMessage}>{error}</div>
          <button className={styles.errorButton} onClick={fetchSprints}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (sprints.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>📅</div>
          <div className={styles.emptyTitle}>No active sprints found</div>
          <div className={styles.emptyMessage}>
            Create a sprint to get started with your project timeline
          </div>
          {projectId && (
            <button className={styles.emptyButton}>Create Sprint</button>
          )}
        </div>
      </div>
    );
  }

  // Helper to get crew avatar path
  const getCrewAvatarPath = (crewKey: string): string => {
    if (crewKey === 'unassigned') {
      return '/starfleet-delta.svg'; // Fallback for unassigned
    }

    // Map crew IDs to avatar filenames
    const avatarMap: Record<string, string> = {
      'picard': 'captain_picard',
      'riker': 'commander_riker',
      'data': 'commander_data',
      'la_forge': 'geordi_la_forge',
      'troi': 'counselor_troi',
      'worf': 'lieutenant_worf',
      'crusher': 'dr_crusher',
      'uhura': 'lieutenant_uhura',
      'quark': 'quark',
      'obrien': 'chief_obrien'
    };

    const avatarName = avatarMap[crewKey] || crewKey;
    return `/crew-avatars/${avatarName}.jpg`;
  };

  // Event handlers
  const handleStoryClick = (story: StoryWithDetails) => {
    console.log('Story clicked:', story.id);
    // TODO: Implement story detail modal
  };

  const handleCrewClick = (crew: CrewMember) => {
    console.log('Crew clicked:', crew);
    // TODO: Implement crew filtering
  };

  // Render all sprints
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {sprints.map(sprint => (
        <SingleSprintView
          key={sprint.id}
          sprint={sprint}
          onStoryClick={handleStoryClick}
          onCrewClick={handleCrewClick}
        />
      ))}
    </div>
  );
}

// Single Sprint View Component
interface SingleSprintViewProps {
  sprint: SprintWithStories;
  onStoryClick: (story: StoryWithDetails) => void;
  onCrewClick: (crew: CrewMember) => void;
}

function SingleSprintView({ sprint, onStoryClick, onCrewClick }: SingleSprintViewProps) {
  const [hoveredStory, setHoveredStory] = useState<string | null>(null);
  const [editingStory, setEditingStory] = useState<StoryWithDetails | null>(null);
  const [draggedStory, setDraggedStory] = useState<StoryWithDetails | null>(null);
  const [dropTargetCrew, setDropTargetCrew] = useState<string | null>(null);

  // Helper to get crew avatar path
  const getCrewAvatarPath = (crewKey: string): string => {
    if (crewKey === 'unassigned') {
      return '/starfleet-delta.svg'; // Fallback for unassigned
    }

    // Map crew IDs to avatar filenames
    const avatarMap: Record<string, string> = {
      'picard': 'captain_picard',
      'riker': 'commander_riker',
      'data': 'commander_data',
      'la_forge': 'geordi_la_forge',
      'troi': 'counselor_troi',
      'worf': 'lieutenant_worf',
      'crusher': 'dr_crusher',
      'uhura': 'lieutenant_uhura',
      'quark': 'quark',
      'obrien': 'chief_obrien'
    };

    const avatarName = avatarMap[crewKey] || crewKey;
    return `/crew-avatars/${avatarName}.jpg`;
  };

  const getTimelineDays = (): TimelineDay[] => {
    const days: TimelineDay[] = [];
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = new Date(startDate);
    let dayNumber = 1;

    while (currentDate <= endDate) {
      const isToday = currentDate.toDateString() === today.toDateString();
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

      days.push({
        date: new Date(currentDate),
        dayNumber,
        isToday,
        isWeekend
      });

      currentDate.setDate(currentDate.getDate() + 1);
      dayNumber++;
    }

    return days;
  };

  const getStoryCompletionDay = (story: StoryWithDetails, sprintDays: number): number => {
    if (story.estimated_completion) {
      const completionDate = new Date(story.estimated_completion);
      const startDate = new Date(sprint.start_date);
      const daysDiff = Math.ceil((completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.min(daysDiff, sprintDays));
    }

    switch (story.status) {
      case 'completed':
      case 'done':
        return Math.floor(sprintDays * 0.3);
      case 'in_review':
        return Math.floor(sprintDays * 0.7);
      case 'in_progress':
        return Math.floor(sprintDays * 0.5);
      case 'planned':
        return Math.floor(sprintDays * 0.6);
      default:
        return Math.floor(sprintDays * 0.8);
    }
  };

  const getStoriesByCrew = (): Record<string, StoryWithDetails[]> => {
    const grouped: Record<string, StoryWithDetails[]> = {};

    [...Object.keys(CREW_MEMBERS), 'unassigned'].forEach(crew => {
      grouped[crew] = [];
    });

    sprint.stories?.forEach(story => {
      const crew = story.assigned_crew_member || 'unassigned';
      grouped[crew].push(story);
    });

    return grouped;
  };

  // Calculate vertical positions for stories to avoid overlaps
  const calculateStoryPositions = (stories: StoryWithDetails[]): Map<string, { yOffset: number; rowIndex: number }> => {
    const positions = new Map<string, { yOffset: number; rowIndex: number }>();
    const rows: Array<{ endDay: number }> = [];

    // Sort stories by start date for consistent stacking
    const sortedStories = [...stories].sort((a, b) => {
      const aStart = a.start_date || a.estimated_completion || sprint.start_date;
      const bStart = b.start_date || b.estimated_completion || sprint.start_date;
      return new Date(aStart).getTime() - new Date(bStart).getTime();
    });

    sortedStories.forEach(story => {
      // Calculate story's time range
      const sprintStart = new Date(sprint.start_date);
      const storyStart = story.start_date ? new Date(story.start_date) : (story.estimated_completion ? new Date(story.estimated_completion) : sprintStart);
      const storyEnd = story.estimated_completion ? new Date(story.estimated_completion) : storyStart;

      const startDay = Math.floor((storyStart.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const endDay = Math.floor((storyEnd.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Find first available row where this story doesn't overlap
      let rowIndex = 0;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].endDay < startDay) {
          // This row is available - story starts after previous one ends
          rowIndex = i;
          rows[i].endDay = endDay;
          break;
        }
      }

      // If no available row found, create new row
      if (rowIndex === 0 && rows.length > 0 && rows[0].endDay >= startDay) {
        rowIndex = rows.length;
        rows.push({ endDay });
      } else if (rows.length === 0) {
        rows.push({ endDay });
      }

      const storyHeight = 92; // Height of each story bar (76px) + margin (16px)
      positions.set(story.id, {
        yOffset: rowIndex * storyHeight,
        rowIndex
      });
    });

    return positions;
  };

  const getVisibleCrew = (): string[] => {
    const crewWithStories = new Set<string>();
    sprint.stories?.forEach(story => {
      crewWithStories.add(story.assigned_crew_member || 'unassigned');
    });

    return [...crewWithStories];
  };

  // Handle duration changes from drag/resize
  const handleDurationChange = async (storyId: string, newStartDate: string, newEndDate: string) => {
    await updateStory(storyId, {
      start_date: newStartDate,
      estimated_completion: newEndDate
    });
  };

  // Handle drag over timeline track
  const handleDragOver = (e: React.DragEvent, crewKey: string) => {
    e.preventDefault();
    setDropTargetCrew(crewKey);
  };

  // Handle drop on timeline track
  const handleDrop = async (e: React.DragEvent, targetCrew: string) => {
    e.preventDefault();
    setDropTargetCrew(null);

    const storyId = e.dataTransfer.getData('storyId');
    const storyDataStr = e.dataTransfer.getData('storyData');

    if (!storyId) return;

    try {
      const storyData = JSON.parse(storyDataStr);

      // Calculate which day was dropped on based on mouse position
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const droppedDay = Math.floor(relativeX / dayWidth) + 1;
      const days = getTimelineDays();

      if (droppedDay >= 1 && droppedDay <= days.length) {
        const targetDate = days[droppedDay - 1].date;

        // Calculate story duration
        let durationDays = 1;
        if (storyData.start_date && storyData.estimated_completion) {
          const start = new Date(storyData.start_date);
          const end = new Date(storyData.estimated_completion);
          durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        } else if (storyData.estimated_hours) {
          durationDays = Math.max(1, Math.ceil(storyData.estimated_hours / 8));
        }

        // Calculate new start and end dates maintaining duration
        const newStartDate = new Date(targetDate);
        const newEndDate = new Date(targetDate);
        newEndDate.setDate(newEndDate.getDate() + durationDays - 1);

        // Update story with new crew and dates
        await updateStory(storyId, {
          assigned_crew_member: targetCrew === 'unassigned' ? undefined : targetCrew as CrewMember,
          start_date: newStartDate.toISOString().split('T')[0],
          estimated_completion: newEndDate.toISOString().split('T')[0]
        });
      } else {
        // If dropped outside valid day range, just update crew
        if (storyData.assigned_crew_member !== targetCrew) {
          await updateStory(storyId, {
            assigned_crew_member: targetCrew === 'unassigned' ? undefined : targetCrew as CrewMember
          });
        }
      }
    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDropTargetCrew(null);
  };

  // Update story via API
  const updateStory = async (storyId: string, updates: Partial<Story>) => {
    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update story');
      }

      // Refresh sprint data
      window.location.reload(); // TODO: Replace with optimistic update
    } catch (error) {
      console.error('Error updating story:', error);
      alert('Failed to update story. Please try again.');
    }
  };

  // Handle story click to open edit modal
  const handleStoryCardClick = (story: StoryWithDetails) => {
    setEditingStory(story);
  };

  // Handle save from modal
  const handleSaveStory = async (updates: Partial<Story>) => {
    if (!editingStory) return;
    await updateStory(editingStory.id, updates);
  };

  const timelineDays = getTimelineDays();
  const storiesByCrew = getStoriesByCrew();
  const visibleCrew = getVisibleCrew();
  const dayWidth = 120; // Width of each day column in pixels

  const totalStories = sprint.stories?.length || 0;
  const completedStories = sprint.stories?.filter(s => s.status === 'completed' || s.status === 'done').length || 0;
  const completionPercentage = totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;

  return (
    <div className={styles.container}>
      {/* Sprint Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.headerTitle}>{sprint.name}</div>
            <div className={styles.headerSubtitle}>
              {new Date(sprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(sprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              <span style={{ margin: '0 8px' }}>•</span>
              {timelineDays.length} days
            </div>
          </div>

          <div className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricValue}>{sprint.velocity_actual || 0}/{sprint.velocity_target || 0}</div>
              <div className={styles.metricLabel}>Story Points</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>{completedStories}/{totalStories}</div>
              <div className={styles.metricLabel}>Stories Complete</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressBarHeader}>
            <span style={{ fontWeight: 'bold' }}>{completionPercentage}% Complete</span>
            <span style={{ opacity: 0.8 }}>
              {timelineDays.some(d => d.isToday) ? 'Sprint in progress' : 'Not started'}
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Sprint Goals */}
        {sprint.goals && sprint.goals.length > 0 && (
          <div className={styles.goals}>
            <div className={styles.goalsHeader}>Sprint Goals</div>
            <ul className={styles.goalsList}>
              {sprint.goals.map((goal, idx) => (
                <li key={idx} className={styles.goalItem}>
                  <span style={{ marginRight: '8px' }}>🎯</span>
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Horizontal Timeline */}
      <div className={styles.timelineArea}>
        <div className={styles.timeline}>
          {/* Timeline Header (Days) */}
          <div className={styles.timelineHeader}>
            <div className={styles.crewLabel}>Crew Member</div>
            {timelineDays.map((day) => (
              <div
                key={day.dayNumber}
                className={`${styles.dayColumn} ${day.isToday ? styles.today : ''} ${day.isWeekend ? styles.weekend : ''}`}
              >
                <div className={styles.dayNumber}>Day {day.dayNumber}</div>
                <div className={styles.dayDate}>
                  {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                {day.isToday && <div className={styles.todayLabel}>TODAY</div>}
              </div>
            ))}
          </div>

          {/* Crew Swimlanes */}
          <div className={styles.swimlanes}>
            {visibleCrew.map((crewKey) => {
              const crewInfo = crewKey === 'unassigned'
                ? { id: 'unassigned' as CrewMember, name: 'Unassigned', role: 'Backlog', specialty: 'No crew assigned' }
                : CREW_MEMBERS[crewKey as CrewMember];

              const crewStories = storiesByCrew[crewKey] || [];
              const totalCrewPoints = crewStories.reduce((sum, s) => sum + (s.story_points || 0), 0);

              // Calculate positions for this crew's stories
              const storyPositions = calculateStoryPositions(crewStories);
              const maxRows = Math.max(1, ...Array.from(storyPositions.values()).map(p => p.rowIndex + 1));
              const trackHeight = Math.max(120, maxRows * 92); // 92px per row, minimum 120px

              // Check for workload overlaps (multiple stories at same time)
              const hasOverlaps = maxRows > 1;
              const totalHours = crewStories.reduce((sum, s) => sum + (s.estimated_hours || 0), 0);
              const sprintDays = timelineDays.length;
              const avgHoursPerDay = sprintDays > 0 ? totalHours / sprintDays : 0;
              const isOverloaded = avgHoursPerDay > 8; // More than 8 hours per day average

              return (
                <div key={crewKey} className={styles.swimlane}>
                  {/* Crew Info Column */}
                  <div
                    className={styles.crewInfo}
                    onClick={() => crewKey !== 'unassigned' && onCrewClick?.(crewKey as CrewMember)}

                  >
                    <div className={styles.crewHeader}>
                      <div className={styles.crewAvatar}>
                        <Image
                          src={getCrewAvatarPath(crewKey)}
                          alt={crewInfo.name}
                          fill
                          sizes="40px"
                          className="avatarImage"
                          priority
                        />
                      </div>
                      <div className={styles.crewDetails}>
                        <div className={styles.crewName}>{crewInfo.name}</div>
                        <div className={styles.crewSpecialty}>{crewInfo.specialty}</div>
                      </div>
                    </div>
                    <div className={styles.crewStats}>
                      <div className={styles.crewPoints}>{totalCrewPoints} pts</div>
                      <div>{crewStories.length} stories</div>
                      {hasOverlaps && (
                        <div className={styles.overlapIndicator} title={`${maxRows} concurrent stories - workload overlap detected`}>
                          ⚠️ {maxRows} rows
                        </div>
                      )}
                      {isOverloaded && (
                        <div className={styles.overloadIndicator} title={`Avg ${avgHoursPerDay.toFixed(1)}h/day - exceeds capacity`}>
                          🔴 Overloaded
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Area with Duration Bars */}
                  <div
                    className={`${styles.timelineTrack} ${dropTargetCrew === crewKey ? styles.dropTarget : ''}`}
                    onDragOver={(e) => handleDragOver(e, crewKey)}
                    onDrop={(e) => handleDrop(e, crewKey)}
                    onDragLeave={handleDragLeave}
                    style={{ minHeight: `${trackHeight}px` }}
                  >
                    {/* Day Grid Background */}
                    {timelineDays.map((day) => (
                      <div
                        key={day.dayNumber}
                        className={`${styles.dayCell} ${day.isToday ? styles.today : ''} ${day.isWeekend ? styles.weekend : ''}`}
                        style={{ width: `${dayWidth}px`, minHeight: `${trackHeight}px` }}
                      />
                    ))}

                    {/* Story Duration Bars (Absolutely Positioned) */}
                    <div className={styles.storiesLayer}>
                      {crewStories.map((story) => {
                        const position = storyPositions.get(story.id) || { yOffset: 0, rowIndex: 0 };
                        return (
                          <StoryDurationBar
                            key={story.id}
                            story={story}
                            sprintStartDate={sprint.start_date}
                            dayWidth={dayWidth}
                            yOffset={position.yOffset}
                            onDurationChange={handleDurationChange}
                            onClick={() => handleStoryCardClick(story)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ borderColor: 'var(--ok)', background: 'rgba(40, 217, 154, 0.15)' }}></div>
              <span>Completed</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ borderColor: 'var(--warn)', background: 'rgba(255, 209, 102, 0.15)' }}></div>
              <span>In Progress</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ borderColor: 'var(--accent1)', background: 'rgba(124, 92, 255, 0.15)' }}></div>
              <span>In Review</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ borderColor: 'var(--good)', background: 'rgba(90, 230, 255, 0.15)' }}></div>
              <span>Planned</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ borderColor: 'var(--risk)', background: 'rgba(255, 92, 147, 0.15)' }}></div>
              <span>Blocked</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ borderColor: 'var(--accent1)', background: 'rgba(124, 92, 255, 0.1)', borderWidth: '2px' }}></div>
              <span style={{ fontWeight: 'bold' }}>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Story Edit Modal */}
      {editingStory && (
        <StoryEditModal
          story={editingStory}
          isOpen={true}
          onClose={() => setEditingStory(null)}
          onSave={handleSaveStory}
          sprintStartDate={sprint.start_date}
          sprintEndDate={sprint.end_date}
        />
      )}
    </div>
  );
}

// Story Timeline Card Component
interface StoryTimelineCardProps {
  story: StoryWithDetails;
  crewKey: string;
  dayNumber: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  onDragStart: (story: StoryWithDetails, crew: string, day: number) => void;
}

function StoryTimelineCard({
  story,
  crewKey,
  dayNumber,
  isHovered,
  onHover,
  onLeave,
  onClick,
  onDragStart
}: StoryTimelineCardProps) {
  const completedCriteria = story.acceptance_criteria?.filter(ac => ac.is_completed).length || 0;
  const totalCriteria = story.acceptance_criteria?.length || 0;
  const criteriaProgress = totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(story, crewKey, dayNumber)}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`${styles.storyCard} ${styles[`status-${story.status}`]}`}
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        zIndex: isHovered ? 10 : 1,
        cursor: 'grab'
      }}
    >
      {story.story_points && (
        <div className={styles.storyPoints}>{story.story_points}</div>
      )}

      {isHighPriority(story.priority) && (
        <div className={styles.priorityStar}>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
          </svg>
        </div>
      )}

      <div className={styles.storyTitle}>{story.title}</div>
      <div className={styles.storyType}>{story.story_type.replace('_', ' ')}</div>

      {totalCriteria > 0 && (
        <div className={styles.criteriaProgress}>
          <div className={styles.criteriaHeader}>
            <span>{completedCriteria}/{totalCriteria}</span>
            <span>{criteriaProgress}%</span>
          </div>
          <div className={styles.criteriaBar}>
            <div className={styles.criteriaFill} style={{ width: `${criteriaProgress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
