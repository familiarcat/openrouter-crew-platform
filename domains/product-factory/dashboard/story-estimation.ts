import { Story, CrewMember, StoryType, EstimationResult } from '
// Standard conversion: 1 story point ~= 4 hours (half day)
const HOURS_PER_POINT = 4;

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
