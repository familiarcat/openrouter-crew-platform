'use client';

/**
 * @deprecated This component is deprecated as of December 29, 2024.
 *
 * REASON: Uses Tailwind CSS classes which are not available in this app.
 * The app uses a custom CSS design system with CSS variables (--bg, --panel, --text, etc.)
 *
 * REPLACEMENT: Use HorizontalSprintTimeline instead, which uses CSS Modules
 * and the app's custom design system.
 *
 * This file is kept for reference only and should not be used in production.
 *
 * ---
 *
 * SprintTimeline - Shared Sprint Visualization Component
 *
 * Content-reactive sprint timeline that works in both web and IDE views.
 * Displays sprints in horizontal timeline format with crew swimlanes.
 *
 * Features:
 * - Responsive scaling (web + IDE)
 * - Real-time data sync
 * - Filter by project/status/crew
 * - Drag-and-drop story cards (future)
 * - Shared theming between environments
 */

import React, { useEffect, useState } from 'react';
import type { Sprint, Story, StoryWithDetails, CrewMember } from '@/types/sprint';
import { CREW_MEMBERS } from '@/types/sprint';

export interface SprintTimelineProps {
  projectId?: string;           // Filter to single project (undefined = all projects)
  viewMode?: 'compact' | 'full'; // Compact for IDE, full for web
  showFilters?: boolean;         // Show filter controls
  height?: number;               // Custom height (for IDE embedding)
  onStoryClick?: (story: StoryWithDetails) => void;
  onSprintClick?: (sprint: Sprint) => void;
}

interface SprintWithStories extends Sprint {
  stories: StoryWithDetails[];
}

export default function SprintTimeline({
  projectId,
  viewMode = 'full',
  showFilters = true,
  height,
  onStoryClick,
  onSprintClick
}: SprintTimelineProps) {
  const [sprints, setSprints] = useState<SprintWithStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedCrew, setSelectedCrew] = useState<string | null>(null);

  // Fetch sprints
  useEffect(() => {
    fetchSprints();
  }, [projectId, selectedStatus]);

  const fetchSprints = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId);
      if (selectedStatus) params.append('status', selectedStatus);
      params.append('include_stories', 'true');

      const response = await fetch(`/api/sprints?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sprints');

      const data = await response.json();
      setSprints(data.sprints || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching sprints:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group stories by crew member
  const getStoriesByCrew = (sprint: SprintWithStories): Record<string, StoryWithDetails[]> => {
    const grouped: Record<string, StoryWithDetails[]> = {};

    // Initialize all crew members
    Object.keys(CREW_MEMBERS).forEach(crew => {
      grouped[crew] = [];
    });

    // Add unassigned group
    grouped['unassigned'] = [];

    // Group stories
    sprint.stories?.forEach(story => {
      const crew = story.assigned_crew_member || 'unassigned';
      if (!grouped[crew]) grouped[crew] = [];
      grouped[crew].push(story);
    });

    return grouped;
  };

  // Filter crew members to show (hide empty in compact mode)
  const getVisibleCrewMembers = (sprint: SprintWithStories): string[] => {
    if (viewMode === 'full') {
      return [...Object.keys(CREW_MEMBERS), 'unassigned'];
    }

    // Compact mode: only show crew with stories
    const storiesByCrew = getStoriesByCrew(sprint);
    return Object.keys(storiesByCrew).filter(crew => storiesByCrew[crew].length > 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading sprints...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading sprints: {error}</p>
        <button
          onClick={fetchSprints}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (sprints.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">No {selectedStatus} sprints found</p>
        {projectId && (
          <p className="text-sm text-gray-500">
            Create a sprint to get started with your project timeline
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="sprint-timeline" style={{ height: height ? `${height}px` : 'auto' }}>
      {/* Filters */}
      {showFilters && (
        <div className="mb-4 flex gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {viewMode === 'full' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Crew:</label>
              <select
                value={selectedCrew || ''}
                onChange={(e) => setSelectedCrew(e.target.value || null)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              >
                <option value="">All Crew</option>
                {Object.entries(CREW_MEMBERS).map(([key, member]) => (
                  <option key={key} value={key}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchSprints}
            className="ml-auto px-4 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Sprint Timeline */}
      <div className="space-y-6">
        {sprints.map((sprint) => (
          <SprintCard
            key={sprint.id}
            sprint={sprint}
            viewMode={viewMode}
            selectedCrew={selectedCrew}
            onStoryClick={onStoryClick}
            onSprintClick={onSprintClick}
            getStoriesByCrew={getStoriesByCrew}
            getVisibleCrewMembers={getVisibleCrewMembers}
          />
        ))}
      </div>
    </div>
  );
}

// Sprint Card Component
interface SprintCardProps {
  sprint: SprintWithStories;
  viewMode: 'compact' | 'full';
  selectedCrew: string | null;
  onStoryClick?: (story: StoryWithDetails) => void;
  onSprintClick?: (sprint: Sprint) => void;
  getStoriesByCrew: (sprint: SprintWithStories) => Record<string, StoryWithDetails[]>;
  getVisibleCrewMembers: (sprint: SprintWithStories) => string[];
}

function SprintCard({
  sprint,
  viewMode,
  selectedCrew,
  onStoryClick,
  onSprintClick,
  getStoriesByCrew,
  getVisibleCrewMembers
}: SprintCardProps) {
  const storiesByCrew = getStoriesByCrew(sprint);
  const visibleCrew = getVisibleCrewMembers(sprint);

  // Calculate sprint progress
  const totalStoryPoints = sprint.velocity_target || 0;
  const completedPoints = sprint.velocity_actual || 0;
  const progressPercentage = totalStoryPoints > 0
    ? Math.round((completedPoints / totalStoryPoints) * 100)
    : 0;

  // Calculate days remaining
  const startDate = new Date(sprint.start_date);
  const endDate = new Date(sprint.end_date);
  const today = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = totalDays - daysElapsed;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Sprint Header */}
      <div
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 cursor-pointer hover:from-blue-600 hover:to-blue-700"
        onClick={() => onSprintClick?.(sprint)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{sprint.name}</h3>
            <p className="text-sm text-blue-100">
              {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold">{completedPoints}/{totalStoryPoints}</div>
            <div className="text-xs text-blue-100">Story Points</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>{progressPercentage}% Complete</span>
            <span>
              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Sprint ended'}
            </span>
          </div>
          <div className="w-full bg-blue-400 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Sprint Goals */}
        {viewMode === 'full' && sprint.goals && sprint.goals.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-blue-100">Goals:</p>
            <ul className="text-sm list-disc list-inside">
              {sprint.goals.map((goal, idx) => (
                <li key={idx}>{goal}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Crew Swimlanes */}
      <div className="p-4">
        <div className="space-y-3">
          {visibleCrew
            .filter(crew => !selectedCrew || crew === selectedCrew)
            .map((crewKey) => {
              const crewInfo = crewKey === 'unassigned'
                ? { id: 'unassigned' as CrewMember, name: 'Unassigned', role: '', specialty: 'Backlog' }
                : CREW_MEMBERS[crewKey as CrewMember];

              const stories = storiesByCrew[crewKey] || [];

              return (
                <CrewSwimlane
                  key={crewKey}
                  crewInfo={crewInfo}
                  stories={stories}
                  viewMode={viewMode}
                  onStoryClick={onStoryClick}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
}

// Crew Swimlane Component
interface CrewSwimlaneProps {
  crewInfo: { id: CrewMember; name: string; role: string; specialty: string };
  stories: StoryWithDetails[];
  viewMode: 'compact' | 'full';
  onStoryClick?: (story: StoryWithDetails) => void;
}

function CrewSwimlane({ crewInfo, stories, viewMode, onStoryClick }: CrewSwimlaneProps) {
  const totalPoints = stories.reduce((sum, s) => sum + (s.story_points || 0), 0);
  const completedStories = stories.filter(s => s.status === 'completed').length;

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      {/* Crew Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {crewInfo.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-sm">{crewInfo.name}</div>
            {viewMode === 'full' && (
              <div className="text-xs text-gray-600">{crewInfo.specialty}</div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold">{totalPoints} pts</div>
          <div className="text-xs text-gray-600">
            {completedStories}/{stories.length} completed
          </div>
        </div>
      </div>

      {/* Story Cards */}
      {stories.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {stories.map((story) => (
            <StoryCardMini
              key={story.id}
              story={story}
              viewMode={viewMode}
              onClick={() => onStoryClick?.(story)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-gray-400">
          No stories assigned
        </div>
      )}
    </div>
  );
}

// Mini Story Card Component
interface StoryCardMiniProps {
  story: StoryWithDetails;
  viewMode: 'compact' | 'full';
  onClick?: () => void;
}

function StoryCardMini({ story, viewMode, onClick }: StoryCardMiniProps) {
  const statusColors: Record<string, string> = {
    backlog: 'bg-gray-200 text-gray-700',
    planned: 'bg-blue-200 text-blue-700',
    in_progress: 'bg-yellow-200 text-yellow-800',
    in_review: 'bg-purple-200 text-purple-700',
    completed: 'bg-green-200 text-green-800',
    blocked: 'bg-red-200 text-red-700'
  };

  const statusColor = statusColors[story.status] || 'bg-gray-200 text-gray-700';

  return (
    <div
      onClick={onClick}
      className={`
        min-w-[180px] max-w-[180px] bg-white border border-gray-300 rounded p-2.5 cursor-pointer
        hover:shadow-md hover:border-blue-400 transition-all
        ${viewMode === 'compact' ? 'min-w-[140px] max-w-[140px]' : ''}
      `}
    >
      {/* Story Header */}
      <div className="flex items-start justify-between mb-2">
        <div className={`text-xs px-2 py-0.5 rounded ${statusColor}`}>
          {story.status.replace('_', ' ')}
        </div>
        {story.story_points && (
          <div className="text-xs font-bold text-gray-600">
            {story.story_points} pts
          </div>
        )}
      </div>

      {/* Story Title */}
      <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
        {story.title}
      </div>

      {/* Story Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="truncate">{story.story_type.replace('_', ' ')}</span>
        {story.priority && (
          <span className={`
            font-semibold
            ${story.priority === 1 ? 'text-red-600' : ''}
            ${story.priority === 2 ? 'text-orange-600' : ''}
          `}>
            P{story.priority}
          </span>
        )}
      </div>

      {/* Acceptance Criteria Progress */}
      {viewMode === 'full' && story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            {story.acceptance_criteria.filter(ac => ac.is_completed).length}/
            {story.acceptance_criteria.length} criteria
          </div>
        </div>
      )}
    </div>
  );
}
