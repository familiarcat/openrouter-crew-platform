import { notFound } from 'next/navigation'
import { ProjectService } from '@openrouter-crew/project-management'
import { SprintBoard } from '@/components/sprints/SprintBoard'

interface ProjectDetailPageProps {
  params: {
    id: string
  }
}

/**
 * Project Detail Page
 *
 * Displays a complete overview of a single project, including its
 * sprints, tasks, cost, and crew assignments.
 *
 * Phase 2 TODO: Implement with ProjectService, ProjectHeader, CostAnalytics, CrewAssignments
 */
export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const projectId = params.id

  // Phase 2: Fetch all required data in parallel using the centralized service
  // const [project, sprints, tasks, costData, crew] = await Promise.all([
  //   ProjectService.getProject(projectId),
  //   ProjectService.getSprintsForProject(projectId),
  //   ProjectService.getTasksForProject(projectId),
  //   ProjectService.getCostAnalytics(projectId),
  //   ProjectService.getCrewAssignments(projectId),
  // ])

  // Phase 2: Handle case where project doesn't exist
  // if (!project) {
  //   return notFound()
  // }

  // Phase 2: Temporary shell - returns placeholder
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="text-center text-gray-400 py-12">
        <h1 className="text-2xl font-bold text-white mb-2">Project {projectId}</h1>
        <p>Project detail page coming in Phase 2...</p>
        <p className="text-sm mt-4">
          Will render ProjectHeader, CostAnalytics, CrewAssignments, and SprintBoard
        </p>
      </div>
    </div>
  )
}
