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
    color: '#ffb000',
    icon: '\uD83D\uDECD\uFE0F',
    description: 'The Mrkt Drop \u2014 affiliate commerce engine',
  },
  {
    id: 'lead-hunter',
    name: 'Lead Hunter',
    color: '#7cc5ff',
    icon: '\uD83C\uDFAF',
    description: 'Merchant services lead generation',
  },
  {
    id: 'paydirect',
    name: 'PayDirect',
    color: '#5ae0a0',
    icon: '\uD83D\uDCB3',
    description: 'Direct payment processing',
  },
  {
    id: 'personal-assistant',
    name: 'Personal Assistant',
    color: '#a78bfa',
    icon: '\uD83E\uDD16',
    description: 'AI-powered personal automation',
  },
];

export function getProject(id: string): ProjectDef | undefined {
  return PROJECTS.find((p) => p.id === id);
}
