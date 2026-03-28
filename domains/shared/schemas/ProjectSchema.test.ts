import { ProjectSchema } from '../index';

describe('ProjectSchema', () => {
  const validProjectData = {
    name: 'OpenRouter Crew Platform',
    status: 'Active',
    metadata: {
      version: '2.0',
      priority: 'high',
      tags: ['ai', 'orchestration']
    }
  };

  it('should validate a correctly structured project', () => {
    const result = ProjectSchema.safeParse(validProjectData);
    expect(result.success).toBe(true);
  });

  it('should fail if name is missing', () => {
    const invalidData = {
      status: 'Active'
    };
    const result = ProjectSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path.includes('name'))).toBe(true);
    }
  });

  it('should fail if status is missing or invalid', () => {
    const invalidData = {
      name: 'Test Project',
      status: 'InvalidStatus'
    };
    const result = ProjectSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should allow optional metadata as a key-value record', () => {
    const projectWithMetadata = {
      ...validProjectData,
      metadata: { 
        customKey: 'customValue',
        numericValue: 42
      }
    };
    const result = ProjectSchema.safeParse(projectWithMetadata);
    expect(result.success).toBe(true);
  });

  it('should validate ISO 8601 datetime strings for timestamps if provided', () => {
    const projectWithDates = {
      ...validProjectData,
      createdAt: '2026-03-27T10:00:00Z',
      updatedAt: '2026-03-27T12:00:00Z'
    };
    const result = ProjectSchema.safeParse(projectWithDates);
    expect(result.success).toBe(true);
  });

  it('should fail if id is not a valid UUID', () => {
    const result = ProjectSchema.safeParse({ ...validProjectData, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});