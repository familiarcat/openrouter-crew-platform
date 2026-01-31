import { Story, StoryType } from './sprint';

/**
 * Calculate estimated duration in hours based on story points
 * Assumption: 1 story point ~= 4 hours (half day)
 */
export const calculateStoryDuration = (points: number = 0): number => {
  return points * 4;
};

/**
 * Format hours into a readable string (e.g., "2d 4h")
 */
export const formatDuration = (hours: number): string => {
  if (hours === 0) return '-';
  
  const days = Math.floor(hours / 8);
  const remainingHours = hours % 8;
  
  if (days > 0) {
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  return `${hours}h`;
};

/**
 * Get color class for story type
 */
export const getStoryColor = (type: StoryType): string => {
  switch (type) {
    case 'feature': return 'bg-alex-blue';
    case 'bug': return 'bg-alex-red';
    case 'chore': return 'bg-slate-500';
    case 'spike': return 'bg-alex-gold';
    default: return 'bg-slate-500';
  }
};

export const DEFAULT_VELOCITY = 20; // points per sprint