/**
 * ProjectGraphBuilder Service - Transform project data into visualization graph
 * Implements the transformation from projects.json to Graph domain model
 */

import { Graph } from '../core/Graph';
import { Node, NodeType } from '../core/Node';
import { Edge } from '../core/Edge';

export interface Project {
  id: string;
  name: string;
  description?: string;
  domains?: Domain[];
  crew?: CrewAssignment[];
  techStack?: TechStack;
  milestones?: Milestone[];
  tags?: string[];
  [key: string]: any;
}

export interface Domain {
  slug: string;
  name: string;
  description?: string;
  features?: string[];
  status?: string;
  progress?: number;
}

export interface CrewAssignment {
  memberId: string;
  role: string;
  assignment: string;
}

export interface TechStack {
  frontend?: string[];
  backend?: string[];
  infrastructure?: string[];
  ai?: string[];
  other?: string[];
}

export interface Milestone {
  id: string;
  name: string;
  status?: string;
  date?: string;
  description?: string;
}

export type ViewDimension = 'domains' | 'tech-stack' | 'crew' | 'milestones' | 'full';

export class ProjectGraphBuilder {
  /**
   * Build graph from project data
   */
  build(project: Project, dimension: ViewDimension = 'domains'): Graph {
    const graph = new Graph(project.id, {
      name: project.name,
      description: project.description,
    });

    // Add root project node
    const rootNode = new Node(
      project.id,
      'project',
      project.name,
      {
        description: project.description,
        tags: project.tags,
        progress: project.progress,
        status: project.status,
      }
    );
    graph.addNode(rootNode);

    // Build graph based on selected dimension
    switch (dimension) {
      case 'domains':
        this.buildDomainsView(graph, project);
        break;
      case 'tech-stack':
        this.buildTechStackView(graph, project);
        break;
      case 'crew':
        this.buildCrewView(graph, project);
        break;
      case 'milestones':
        this.buildMilestonesView(graph, project);
        break;
      case 'full':
        this.buildFullView(graph, project);
        break;
    }

    return graph;
  }

  /**
   * Domains view - Show project → domains → features
   */
  private buildDomainsView(graph: Graph, project: Project): void {
    if (!project.domains || project.domains.length === 0) {
      return;
    }

    for (const domain of project.domains) {
      // Add domain node
      const domainNode = new Node(
        `${project.id}_domain_${domain.slug}`,
        'domain',
        domain.name,
        {
          description: domain.description,
          status: domain.status,
          progress: domain.progress,
          slug: domain.slug,
        }
      );
      graph.addNode(domainNode);

      // Connect project → domain
      const edge = new Edge(
        `${project.id}_to_${domain.slug}`,
        'contains',
        project.id,
        domainNode.id
      );
      graph.addEdge(edge);

      // Add features as child nodes
      if (domain.features && domain.features.length > 0) {
        for (let i = 0; i < domain.features.length; i++) {
          const feature = domain.features[i];
          const featureNode = new Node(
            `${domainNode.id}_feature_${i}`,
            'feature',
            feature,
            { domain: domain.slug }
          );
          graph.addNode(featureNode);

          const featureEdge = new Edge(
            `${domainNode.id}_to_feature_${i}`,
            'contains',
            domainNode.id,
            featureNode.id
          );
          graph.addEdge(featureEdge);
        }
      }
    }
  }

  /**
   * Tech stack view - Show project → tech categories → technologies
   */
  private buildTechStackView(graph: Graph, project: Project): void {
    if (!project.techStack) {
      return;
    }

    const categories = [
      'frontend',
      'backend',
      'infrastructure',
      'ai',
      'other',
    ] as const;

    for (const category of categories) {
      const techs = project.techStack[category];
      if (!techs || techs.length === 0) continue;

      // Add category node
      const categoryNode = new Node(
        `${project.id}_tech_${category}`,
        'directory',
        category.charAt(0).toUpperCase() + category.slice(1),
        { category: 'tech-stack' }
      );
      graph.addNode(categoryNode);

      // Connect project → category
      graph.addEdge(
        new Edge(
          `${project.id}_to_${category}`,
          'contains',
          project.id,
          categoryNode.id
        )
      );

      // Add tech dependencies
      for (let i = 0; i < techs.length; i++) {
        const tech = techs[i];
        const techNode = new Node(
          `${categoryNode.id}_${i}`,
          'dependency',
          tech,
          { category }
        );
        graph.addNode(techNode);

        graph.addEdge(
          new Edge(
            `${categoryNode.id}_to_${i}`,
            'depends_on',
            categoryNode.id,
            techNode.id
          )
        );
      }
    }
  }

  /**
   * Crew view - Show project → crew members → assignments
   */
  private buildCrewView(graph: Graph, project: Project): void {
    if (!project.crew || project.crew.length === 0) {
      return;
    }

    for (const assignment of project.crew) {
      // Add crew member node
      const crewNode = new Node(
        `${project.id}_crew_${assignment.memberId}`,
        'tag',
        assignment.memberId.replace(/_/g, ' '),
        {
          role: assignment.role,
          assignment: assignment.assignment,
        }
      );
      graph.addNode(crewNode);

      // Connect project → crew
      graph.addEdge(
        new Edge(
          `${project.id}_to_${assignment.memberId}`,
          'related_to',
          project.id,
          crewNode.id,
          { role: assignment.role }
        )
      );
    }
  }

  /**
   * Milestones view - Show project → milestones
   */
  private buildMilestonesView(graph: Graph, project: Project): void {
    if (!project.milestones || project.milestones.length === 0) {
      return;
    }

    for (const milestone of project.milestones) {
      // Add milestone node
      const milestoneNode = new Node(
        `${project.id}_milestone_${milestone.id}`,
        'milestone',
        milestone.name,
        {
          status: milestone.status,
          date: milestone.date,
          description: milestone.description,
        }
      );
      graph.addNode(milestoneNode);

      // Connect project → milestone
      graph.addEdge(
        new Edge(
          `${project.id}_to_milestone_${milestone.id}`,
          'milestone',
          project.id,
          milestoneNode.id
        )
      );
    }
  }

  /**
   * Full view - Combine all dimensions
   */
  private buildFullView(graph: Graph, project: Project): void {
    this.buildDomainsView(graph, project);
    this.buildTechStackView(graph, project);
    this.buildCrewView(graph, project);
    this.buildMilestonesView(graph, project);
  }
}
