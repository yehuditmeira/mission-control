export type ThisWeekTask = {
  title: string;
  due?: string; // ISO date, e.g. '2026-04-22'
  done?: boolean;
};

export type ProjectDef = {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  // Launch / cadence info — sourced from each project's marketing docs
  launchDate?: string; // ISO date for the next major launch
  launchLabel?: string; // e.g. "Public launch", "Pinterest go-live"
  thisWeek?: ThisWeekTask[];
  // Where the source-of-truth content lives (relative to ~/Desktop/AI_Folder)
  contentSources?: string[];
};

export const PROJECTS: ProjectDef[] = [
  {
    id: 'affiliate-flow',
    name: 'Affiliate Flow',
    color: '#ffb000',
    icon: '\uD83D\uDECD\uFE0F',
    description: 'The Mrkt Drop \u2014 affiliate commerce engine',
    launchDate: '2026-04-21',
    launchLabel: 'Pinterest rollout begins (Week 1 of 16-week multi-platform plan)',
    contentSources: [
      'Affiliate_Flow/Platforms/MASTER_GANTT_TIMELINE.md',
      'Affiliate_Flow/Platforms/social-growth-plan.md',
    ],
    thisWeek: [
      { title: 'Pinterest setup: 5 boards live (Shabbos Outfit Ideas, Tznius Workwear, Modest Wedding Guest, Simcha Style, Family Matching)', due: '2026-04-21' },
      { title: 'Pin design templates in Canva — first 10 pins ready', due: '2026-04-21' },
      { title: 'Tailwind / scheduler set up for daily 10-pin target', due: '2026-04-22' },
      { title: 'Logo SVG + transparent PNG variants (blocker for all platforms)', due: '2026-04-22' },
      { title: 'SEO/Blog setup begins (Week 2)', due: '2026-04-28' },
    ],
  },
  {
    id: 'lead-hunter',
    name: 'Lead Hunter',
    color: '#7cc5ff',
    icon: '\uD83C\uDFAF',
    description: 'Merchant services lead generation',
    contentSources: ['Merchant_Services/.planning/STATE.md'],
    thisWeek: [
      { title: 'v1.4 shipped — monitoring lead quality + Ziv\'s call conversion', done: true },
    ],
  },
  {
    id: 'paydirect',
    name: 'PayDirect',
    color: '#5ae0a0',
    icon: '\uD83D\uDCB3',
    description: 'Developer-first payment API \u2014 IC+ pricing, surcharge in one boolean',
    launchDate: '2026-04-22',
    launchLabel: 'Public launch (Week 1 Monday thread goes live)',
    contentSources: [
      'paydirect/marketing/content-calendar/week-01.md',
      'paydirect/marketing/content-calendar/posting-plan.md',
      'paydirect/marketing/launch-day-sequence.md',
      'paydirect/marketing/social-accounts-checklist.md',
    ],
    thisWeek: [
      { title: 'Create X/Twitter account (@paydirect or @paydirectapi)', due: '2026-04-21' },
      { title: 'Create Reddit, YouTube, Substack accounts', due: '2026-04-21' },
      { title: 'Research NMI vs Authorize.net (gateway partner decision)', due: '2026-04-21' },
      { title: 'Get the best interchange-plus pricing quote — "don\'t look dumb on camera"', due: '2026-04-21' },
      { title: 'LAUNCH: Monday 9am ET thread (5 tweets, READY TO POST)', due: '2026-04-22' },
      { title: 'Tuesday 12pm — progress tweet', due: '2026-04-23' },
      { title: 'Wednesday 10am — pricing transparency post (X + Dev.to seed)', due: '2026-04-24' },
      { title: 'Thursday 11am — hot take tweet', due: '2026-04-25' },
      { title: 'Friday 8am — Substack post + share on Twitter', due: '2026-04-26' },
      { title: 'Saturday 11am — YouTube/TikTok/IG Reels short (filmed by husband)', due: '2026-04-27' },
    ],
  },
  {
    id: 'personal-assistant',
    name: 'Personal Assistant',
    color: '#a78bfa',
    icon: '\uD83E\uDD16',
    description: 'AI-powered personal automation',
    contentSources: ['personal-assistant/.planning/STATE.md'],
    thisWeek: [
      { title: 'Phase 7 — Brief Format Enhancement (planning)' },
    ],
  },
];

export function getProject(id: string): ProjectDef | undefined {
  return PROJECTS.find((p) => p.id === id);
}

// Days between today and a target ISO date (positive = future, 0 = today, negative = past)
export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
