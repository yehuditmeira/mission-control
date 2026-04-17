export type ProjectDef = {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
};

export const PROJECTS: ProjectDef[] = [
  {
    id: 'affiliate-flow',
    name: 'Affiliate Flow',
    color: '#8B5CF6',
    icon: '\uD83D\uDECD\uFE0F',
    description: 'The Mrkt Drop \u2014 affiliate commerce engine',
  },
  {
    id: 'lead-hunter',
    name: 'Lead Hunter',
    color: '#F59E0B',
    icon: '\uD83C\uDFAF',
    description: 'Merchant services lead generation',
  },
  {
    id: 'paydirect',
    name: 'PayDirect',
    color: '#10B981',
    icon: '\uD83D\uDCB3',
    description: 'Direct payment processing',
  },
  {
    id: 'personal-assistant',
    name: 'Personal Assistant',
    color: '#3B82F6',
    icon: '\uD83E\uDD16',
    description: 'AI-powered personal automation',
  },
];

export function getProject(id: string): ProjectDef | undefined {
  return PROJECTS.find((p) => p.id === id);
}
