import { Story } from './sprint';

// Standard conversion: 1 story point ~= 4 hours (half day)
const HOURS_PER_POINT = 4;

/**
 * Estimate duration in hours based on story points
 */
export function estimateDuration(points: number): number {
  return (points || 0) * HOURS_PER_POINT;
}

/**
 * Calculate total points for a set of stories
 */
export function calculateTotalPoints(stories: Story[]): number {
  return stories.reduce((total, story) => total + (story.points || 0), 0);
}

/**
 * Format hours into a readable string (e.g., "2d 4h")
 */
export function formatDuration(hours: number): string {
  if (hours === 0) return '0h';
  
  const days = Math.floor(hours / 8);
  const remainingHours = hours % 8;
  
  if (days > 0) {
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  return `${hours}h`;
}