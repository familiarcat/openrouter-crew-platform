/**
 * Sprint System Runtime Validation
 *
 * Provides runtime validation for sprint-related types to ensure data
 * consistency between client, server, and database.
 */

import type {
  Sprint,
  Story,
  SprintStatus,
  StoryStatus,
  StoryType,
  CrewMember,
  CreateSprintRequest,
  CreateStoryRequest,
  UpdateStoryRequest
} from '@/types/sprint';

// ============================================================================
// Enum Validators
// ============================================================================

const VALID_SPRINT_STATUSES: SprintStatus[] = [
  'planning',
  'active',
  'completed',
  'cancelled'
];

const VALID_STORY_STATUSES: StoryStatus[] = [
  'backlog',
  'planned',
  'in_progress',
  'in_review',
  'completed',
  'blocked'
];

const VALID_STORY_TYPES: StoryType[] = [
  'user_story',
  'developer_story',
  'technical_task',
  'bug_fix'
];

const VALID_CREW_MEMBERS: CrewMember[] = [
  'picard',
  'riker',
  'data',
  'la_forge',
  'troi',
  'worf',
  'crusher',
  'uhura',
  'quark',
  'obrien'
];

/**
 * Validate sprint status enum value
 */
export function validateSprintStatus(status: unknown): status is SprintStatus {
  return typeof status === 'string' && VALID_SPRINT_STATUSES.includes(status as SprintStatus);
}

/**
 * Validate story status enum value
 */
export function validateStoryStatus(status: unknown): status is StoryStatus {
  return typeof status === 'string' && VALID_STORY_STATUSES.includes(status as StoryStatus);
}

/**
 * Validate story type enum value
 */
export function validateStoryType(type: unknown): type is StoryType {
  return typeof type === 'string' && VALID_STORY_TYPES.includes(type as StoryType);
}

/**
 * Validate crew member enum value
 */
export function validateCrewMember(crew: unknown): crew is CrewMember {
  return typeof crew === 'string' && VALID_CREW_MEMBERS.includes(crew as CrewMember);
}

// ============================================================================
// Validation Result Type
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// Entity Validators
// ============================================================================

/**
 * Validate Sprint object
 */
export function validateSprint(sprint: unknown): ValidationResult {
  const errors: string[] = [];

  if (!sprint || typeof sprint !== 'object') {
    return { valid: false, errors: ['Sprint must be an object'] };
  }

  const s = sprint as Partial<Sprint>;

  // Required fields
  if (!s.id || typeof s.id !== 'string') {
    errors.push('Sprint must have a valid id (string)');
  }

  if (!s.project_id || typeof s.project_id !== 'string') {
    errors.push('Sprint must have a valid project_id (string)');
  }

  if (!s.name || typeof s.name !== 'string') {
    errors.push('Sprint must have a valid name (string)');
  }

  if (typeof s.sprint_number !== 'number' || s.sprint_number < 1) {
    errors.push('Sprint must have a valid sprint_number (positive number)');
  }

  if (!s.start_date || typeof s.start_date !== 'string') {
    errors.push('Sprint must have a valid start_date (ISO string)');
  }

  if (!s.end_date || typeof s.end_date !== 'string') {
    errors.push('Sprint must have a valid end_date (ISO string)');
  }

  if (!s.status || !validateSprintStatus(s.status)) {
    errors.push(`Sprint status must be one of: ${VALID_SPRINT_STATUSES.join(', ')}`);
  }

  // Optional but validated fields
  if (s.goals !== undefined && !Array.isArray(s.goals)) {
    errors.push('Sprint goals must be an array');
  }

  if (s.velocity_target !== undefined && typeof s.velocity_target !== 'number') {
    errors.push('Sprint velocity_target must be a number');
  }

  if (s.velocity_actual !== undefined && typeof s.velocity_actual !== 'number') {
    errors.push('Sprint velocity_actual must be a number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate Story object
 */
export function validateStory(story: unknown): ValidationResult {
  const errors: string[] = [];

  if (!story || typeof story !== 'object') {
    return { valid: false, errors: ['Story must be an object'] };
  }

  const s = story as Partial<Story>;

  // Required fields
  if (!s.id || typeof s.id !== 'string') {
    errors.push('Story must have a valid id (string)');
  }

  if (!s.project_id || typeof s.project_id !== 'string') {
    errors.push('Story must have a valid project_id (string)');
  }

  if (!s.title || typeof s.title !== 'string') {
    errors.push('Story must have a valid title (string)');
  }

  if (!s.story_type || !validateStoryType(s.story_type)) {
    errors.push(`Story type must be one of: ${VALID_STORY_TYPES.join(', ')}`);
  }

  if (!s.status || !validateStoryStatus(s.status)) {
    errors.push(`Story status must be one of: ${VALID_STORY_STATUSES.join(', ')}`);
  }

  if (typeof s.priority !== 'number' || s.priority < 1 || s.priority > 5) {
    errors.push('Story priority must be a number between 1 and 5');
  }

  // Optional but validated fields
  if (s.assigned_crew_member !== undefined && s.assigned_crew_member !== null) {
    if (!validateCrewMember(s.assigned_crew_member)) {
      errors.push(`Story assigned_crew_member must be one of: ${VALID_CREW_MEMBERS.join(', ')}`);
    }
  }

  if (s.story_points !== undefined && s.story_points !== null) {
    if (typeof s.story_points !== 'number' || s.story_points < 0) {
      errors.push('Story points must be a non-negative number');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate CreateSprintRequest
 */
export function validateCreateSprintRequest(request: unknown): ValidationResult {
  const errors: string[] = [];

  if (!request || typeof request !== 'object') {
    return { valid: false, errors: ['Request must be an object'] };
  }

  const r = request as Partial<CreateSprintRequest>;

  if (!r.project_id || typeof r.project_id !== 'string') {
    errors.push('project_id is required (string)');
  }

  if (!r.name || typeof r.name !== 'string') {
    errors.push('name is required (string)');
  }

  if (typeof r.sprint_number !== 'number' || r.sprint_number < 1) {
    errors.push('sprint_number is required (positive number)');
  }

  if (!r.start_date || typeof r.start_date !== 'string') {
    errors.push('start_date is required (ISO string)');
  }

  if (!r.end_date || typeof r.end_date !== 'string') {
    errors.push('end_date is required (ISO string)');
  }

  if (!r.goals || !Array.isArray(r.goals)) {
    errors.push('goals is required (array)');
  }

  if (r.velocity_target !== undefined && typeof r.velocity_target !== 'number') {
    errors.push('velocity_target must be a number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate CreateStoryRequest
 */
export function validateCreateStoryRequest(request: unknown): ValidationResult {
  const errors: string[] = [];

  if (!request || typeof request !== 'object') {
    return { valid: false, errors: ['Request must be an object'] };
  }

  const r = request as Partial<CreateStoryRequest>;

  if (!r.project_id || typeof r.project_id !== 'string') {
    errors.push('project_id is required (string)');
  }

  if (!r.title || typeof r.title !== 'string') {
    errors.push('title is required (string)');
  }

  if (!r.story_type || !validateStoryType(r.story_type)) {
    errors.push(`story_type must be one of: ${VALID_STORY_TYPES.join(', ')}`);
  }

  if (typeof r.priority !== 'number' || r.priority < 1 || r.priority > 5) {
    errors.push('priority is required (number between 1 and 5)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate UpdateStoryRequest
 */
export function validateUpdateStoryRequest(request: unknown): ValidationResult {
  const errors: string[] = [];

  if (!request || typeof request !== 'object') {
    return { valid: false, errors: ['Request must be an object'] };
  }

  const r = request as Partial<UpdateStoryRequest>;

  // All fields are optional, but if provided must be valid
  if (r.status !== undefined && !validateStoryStatus(r.status)) {
    errors.push(`status must be one of: ${VALID_STORY_STATUSES.join(', ')}`);
  }

  if (r.assigned_crew_member !== undefined && r.assigned_crew_member !== null) {
    if (!validateCrewMember(r.assigned_crew_member)) {
      errors.push(`assigned_crew_member must be one of: ${VALID_CREW_MEMBERS.join(', ')}`);
    }
  }

  if (r.priority !== undefined) {
    if (typeof r.priority !== 'number' || r.priority < 1 || r.priority > 5) {
      errors.push('priority must be a number between 1 and 5');
    }
  }

  if (r.story_points !== undefined && r.story_points !== null) {
    if (typeof r.story_points !== 'number' || r.story_points < 0) {
      errors.push('story_points must be a non-negative number');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Export all valid values for reference
// ============================================================================

export const SPRINT_VALIDATION_CONSTANTS = {
  VALID_SPRINT_STATUSES,
  VALID_STORY_STATUSES,
  VALID_STORY_TYPES,
  VALID_CREW_MEMBERS
};
