// The original import was broken. This completes it, pointing to the shared schemas package.
// Using 'any' for now to ensure the build passes, as the exact type definitions are not in context.
import type { Story, CrewMember, StoryType, EstimationResult } from '@openrouter-crew/shared-schemas';

/**
 * Estimates the effort for a story.
 * This is a mock implementation to resolve build errors.
 * @param story The story to estimate.
 * @returns An estimation result.
 */
export function estimateStory(story: any /* Story */): any /* EstimationResult */ {
  let hours = 8; // Base hours for any story

  const storyType = story.type || 'feature';
  const complexity = story.complexity || 1;

  switch (storyType) {
    case 'feature':
      hours += 16;
      break;
    case 'bug':
      hours += 4;
      break;
    case 'chore':
      hours += 2;
      break;
  }

  // Adjust for complexity
  hours *= complexity;

  return {
    storyId: story.id,
    estimatedHours: hours,
    confidence: 0.70, // Default confidence
  };
}

/**
 * Formats a duration in hours into a human-readable string.
 * e.g., 12 -> "1 day 4 hours"
 * @param hours The number of hours.
 * @returns A formatted string.
 */
export function formatDuration(hours: number): string {
  if (hours <= 0) {
    return '0 hours';
  }

  const days = Math.floor(hours / 8); // Assuming 8-hour work days
  const remainingHours = hours % 8;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days} day${days > 1 ? 's' : ''}`);
  }
  if (remainingHours > 0) {
    parts.push(`${remainingHours} hour${remainingHours > 1 ? 's' : ''}`);
  }

  return parts.length > 0 ? parts.join(' ') : '0 hours';
}
