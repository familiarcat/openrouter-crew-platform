import { Story, CrewMember, StoryType, EstimationResult } from '../../domains/product-factory/dashboard/types/sprint';

// Standard conversion: 1 story point ~= 4 hours (half day)
const HOURS_PER_POINT = 4;

export const CREW_HOURLY_RATES: Record<string, number> = {
  'picard': 150,
  'riker': 120,
  'data': 100,
  'la_forge': 110,
  'worf': 90,
  'troi': 100,
  'crusher': 110,
  'uhura': 95,
  'quark': 200,
  'obrien': 105,
  'unassigned': 0
};

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
  return stories.reduce((total, story) => total + (story.story_points || story.points || 0), 0);
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

export function estimateCost(hours: number, crewId?: string): number {
  const rate = crewId && CREW_HOURLY_RATES[crewId] ? CREW_HOURLY_RATES[crewId] : 0;
  return hours * rate;
}

export function calculateDurationDays(hours: number): number {
  return Math.max(1, Math.ceil(hours / 8));
}

export function getEstimationRecommendation(
  points: number, 
  type: StoryType, 
  priority: number, 
  crewId?: string
): EstimationResult {
  const estimatedHours = estimateDuration(points);
  const estimatedCost = estimateCost(estimatedHours, crewId);
  
  // Simple logic for recommendation
  let recommendation = "Standard implementation.";
  if (points > 13) recommendation = "Story is too large. Consider splitting.";
  if (priority <= 1) recommendation = "Critical priority. Assign senior crew.";
  
  // ROI Score calculation (mock logic)
  const priorityFactor = (6 - priority) * 20;
  const costFactor = estimatedCost > 0 ? Math.max(0, 100 - (estimatedCost / points / 10)) : 50;
  const roiScore = Math.min(100, Math.round((priorityFactor + costFactor) / 2));

  return {
    estimatedHours,
    estimatedCost,
    recommendation,
    roiScore
  };
}