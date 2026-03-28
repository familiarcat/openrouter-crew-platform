/**
 * Project Architecture Visualization Page
 * Shows interactive graph visualization of project structure
 */

import { notFound } from 'next/navigation';
import { readFile } from 'fs/promises';
import path from 'path';
import { ArchitectureViewer } from '@/components/visualization/ArchitectureViewer';
import { ProjectGraphBuilder, Project } from '@/lib/visualization';

interface ProjectsData {
  projects: Project[];
  meta?: Record<string, unknown>;
}

async function getProject(id: string): Promise<Project | null> {
  try {
    const projectsFile = path.join(process.cwd(), 'data', 'projects.json');
    const content = await readFile(projectsFile, 'utf-8');
    const data: ProjectsData = JSON.parse(content);
    return data.projects.find((p) => p.id === id) || null;
  } catch (error) {
    console.error('Error loading project:', error);
    return null;
  }
}

export default async function ProjectArchitecturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  // Build initial graph with 'domains' dimension
  const builder = new ProjectGraphBuilder();
  const graph = builder.build(project, 'domains');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <a
              href={`/projects/${project.id}`}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              ← Back to Project
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {project.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Architecture Visualization
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Domains
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.domains?.length || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Crew Members
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.crew?.length || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Progress
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.progress || 0}%
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Status
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {project.status || 'Unknown'}
            </div>
          </div>
        </div>

        {/* Visualization */}
        <ArchitectureViewer projectId={project.id} initialGraph={graph} />
      </div>
    </div>
  );
}
