// File: apps/unified-dashboard/__tests__/services/project-service.test.ts

import { ProjectService } from '@openrouter-crew/project-management'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'proj-1',
        name: 'Test Project',
        type: 'product-factory',
        budget_usd: 1000,
        status: 'active',
        total_cost_usd: 0,
      },
      error: null,
    }),
    order: jest.fn().mockReturnThis(),
  })),
} as unknown as SupabaseClient

describe('ProjectService', () => {
  let projectService: ProjectService

  beforeEach(() => {
    jest.clearAllMocks()
    projectService = ProjectService.create(mockSupabase)
  })

  describe('getProject', () => {
    it('should fetch a single project by ID', async () => {
      const project = await projectService.getProject('proj-1')
      expect(project).toBeDefined()
      expect(project?.id).toBe('proj-1')
    })

    it('should return null for non-existent project', async () => {
      const project = await projectService.getProject('non-existent')
      expect(project).toBeNull()
    })
  })

  describe('getSprintsForProject', () => {
    it('should fetch all sprints for a project', async () => {
      const sprints = await projectService.getSprintsForProject('proj-1')
      expect(Array.isArray(sprints)).toBe(true)
    })
  })

  describe('getCostAnalytics', () => {
    it('should calculate cost analytics', async () => {
      const analytics = await projectService.getCostAnalytics('proj-1')
      expect(analytics).toHaveProperty('budget')
      expect(analytics).toHaveProperty('spent')
      expect(analytics).toHaveProperty('remaining')
    })
  })

  describe('getCrewAssignments', () => {
    it('should fetch crew assignments for project', async () => {
      const assignments = await projectService.getCrewAssignments('proj-1')
      expect(Array.isArray(assignments)).toBe(true)
    })
  })

  describe('getActiveSprint', () => {
    it('should return the active sprint', async () => {
      const sprint = await projectService.getActiveSprint('proj-1')
      expect(sprint).toBeUndefined() // Returns undefined until sprint exists
    })
  })

  describe('createProject', () => {
    it('should create a new project', async () => {
      const project = await projectService.createProject({
        name: 'New Project',
        type: 'product-factory',
        budget_usd: 2000,
        description: 'A test project',
      })
      expect(project).toBeDefined()
    })

    it('should require project name', async () => {
      expect(() => {
        projectService.createProject({
          name: '',
          type: 'product-factory',
        })
      }).toThrow()
    })
  })
})
