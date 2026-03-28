/**
 * Project-Specific Sprint Page
 *
 * Shows sprint timeline for a single project.
 * Accessed from "All Projects" when clicking on a project.
 */

import HorizontalSprintTimeline from '@/components/HorizontalSprintTimeline';

interface ProjectSprintsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ProjectSprintsPageProps) {
  const { id } = await params;
  return {
    title: `Sprints - ${id} | Alex AI`,
    description: `Sprint timeline for ${id}`
  };
}

export default async function ProjectSprintsPage({ params }: ProjectSprintsPageProps) {
  const { id: projectId } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <a href="/projects" className="hover:text-blue-600">
                  All Projects
                </a>
                <span>/</span>
                <span className="text-gray-900 font-medium">{projectId}</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">Sprints</span>
              </nav>

              <h1 className="text-3xl font-bold text-gray-900">
                🎯 {projectId} - Sprints
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Sprint timeline and story management
              </p>
            </div>

            <div className="flex gap-2">
              <a
                href={`/api/sprints?project_id=${projectId}&include_stories=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
              >
                View API Data
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Sprint Timeline */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HorizontalSprintTimeline
          projectId={projectId}
        />
      </div>

      {/* Project Sprint Stats */}
      <ProjectSprintStats projectId={projectId} />
    </div>
  );
}

// Project Sprint Stats
interface ProjectSprintStatsProps {
  projectId: string;
}

function ProjectSprintStats({ projectId }: ProjectSprintStatsProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sprint Velocity Chart */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Sprint Velocity Trend</h3>
          <div className="h-48 flex items-center justify-center text-gray-400">
            Velocity chart coming soon...
          </div>
        </div>

        {/* Crew Workload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Crew Capacity</h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Current sprint workload distribution
            </div>
            <div className="h-32 flex items-center justify-center text-gray-400">
              Workload chart coming soon...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
