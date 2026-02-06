import type { Project, ProjectComponent, ProjectContent } from '@/types/project';

export type AdvisorCode = 'conversion_strategist' | 'brand_psychologist' | 'data_analyst' | 'clinical_compliance' | 'creative_director';

export function getAdvisorOptions(): { code: AdvisorCode; title: string }[] {
  return [
    { code: 'conversion_strategist', title: 'Conversion Strategist' },
    { code: 'brand_psychologist', title: 'Brand Psychologist' },
    { code: 'data_analyst', title: 'Data Analyst' },
    { code: 'clinical_compliance', title: 'Clinical Compliance' },
    { code: 'creative_director', title: 'Creative Director' },
  ];
}

export function getProfessionalSuggestion(
  component: ProjectComponent,
  project: Project,
  advisor?: AdvisorCode
): { title: string; body: string } {
  // This is a mock implementation. A real implementation would use an LLM.
  return {
    title: `Suggested: ${component.title || 'New Component'}`,
    body: `This is a mock suggestion for the '${project.name}' project, from the perspective of a ${advisor || 'default advisor'}.`
  };
}
