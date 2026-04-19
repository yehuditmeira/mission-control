'use client';

import { useEffect, useRef } from 'react';

// Faithful port of agent-org-chart_2.html — 5-tier hierarchy with SVG connectors.
// Data-driven so projects/agents can be edited without touching layout code.

type SubAgent = { name: string; desc?: string };
type ProjectNode = {
  id: string;
  name: string;
  desc: string;
  accent: 'green' | 'emerald' | 'orange';
  subs: SubAgent[];
  social?: { id: string; channels: string[] };
};

const projects: ProjectNode[] = [
  {
    id: 'n-merchant',
    name: 'Merchant Services',
    desc: 'Sources & qualifies merchant prospects',
    accent: 'green',
    subs: [
      { name: '▸ Government Scan', desc: 'Public filings & new business registries' },
      { name: '▸ Reddit Scan', desc: 'Merchant pain-point signals' },
      { name: '▸ Complaint Scanner', desc: 'BBB, Yelp, Trustpilot, Google reviews' },
    ],
  },
  {
    id: 'n-personal',
    name: 'Personal Assistant',
    desc: 'Daily ops, briefings, scheduling',
    accent: 'emerald',
    subs: [
      { name: '▸ Morning Briefing Builder' },
      { name: '▸ Evening Prep Builder' },
      { name: '▸ Task / Calendar Reconciler' },
      { name: '▸ Reminder Monitor' },
      { name: '▸ Weekly Planning Agent' },
      { name: '▸ Event / Travel Prep Builder' },
      { name: '▸ Errands / Logistics Organizer' },
    ],
  },
  {
    id: 'n-affiliate',
    name: 'Affiliate Flow',
    desc: 'Market Drop catalog & content engine',
    accent: 'green',
    subs: [
      { name: '▸ Dead Link Scanner', desc: 'Flags broken affiliate URLs' },
      { name: '▸ Sales Scanner', desc: 'Price drops & new promos' },
    ],
    social: {
      id: 'n-social-affiliate',
      channels: ['Pinterest', 'Twitter / X', 'TikTok', 'Instagram', 'Facebook', 'SEO (Blog Posts)', 'WhatsApp'],
    },
  },
  {
    id: 'n-paydirect',
    name: 'PayDirect / Dev Pay',
    desc: 'Merchant processing + payment links',
    accent: 'orange',
    subs: [],
    social: {
      id: 'n-social-paydirect',
      channels: ['Reddit', 'Twitter / X', 'YouTube', 'Substack'],
    },
  },
];

const ACCENT_TOP: Record<ProjectNode['accent'], string> = {
  green: '#a3e635',
  emerald: '#34d399',
  orange: '#fb923c',
};

export default function OrgPage() {
  const chartRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    function drawConnectors() {
      const chart = chartRef.current;
      const svg = svgRef.current;
      if (!chart || !svg) return;

      svg.innerHTML = '';
      const chartRect = chart.getBoundingClientRect();
      svg.setAttribute('width', String(chartRect.width));
      svg.setAttribute('height', String(chartRect.height));

      const stroke = '#3d4458';

      function getCenter(el: HTMLElement, edge: 'top' | 'bottom') {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2 - chartRect.left;
        const y = (edge === 'top' ? r.top : r.bottom) - chartRect.top;
        return { x, y };
      }

      function addLine(x1: number, y1: number, x2: number, y2: number) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(x1));
        line.setAttribute('y1', String(y1));
        line.setAttribute('x2', String(x2));
        line.setAttribute('y2', String(y2));
        line.setAttribute('stroke', stroke);
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-linecap', 'round');
        svg.appendChild(line);
      }

      function drawTree(parentId: string, childIds: string[]) {
        const parent = document.getElementById(parentId);
        if (!parent) return;
        const pBottom = getCenter(parent, 'bottom');
        const childTops = childIds
          .map((id) => document.getElementById(id))
          .filter((el): el is HTMLElement => Boolean(el))
          .map((el) => getCenter(el, 'top'));
        if (!childTops.length) return;

        const childMinY = Math.min(...childTops.map((c) => c.y));
        const midY = pBottom.y + (childMinY - pBottom.y) / 2;

        addLine(pBottom.x, pBottom.y, pBottom.x, midY);

        const minX = Math.min(pBottom.x, ...childTops.map((c) => c.x));
        const maxX = Math.max(pBottom.x, ...childTops.map((c) => c.x));
        addLine(minX, midY, maxX, midY);

        childTops.forEach((c) => addLine(c.x, midY, c.x, c.y));
      }

      function drawDirect(parentId: string, childId: string) {
        const parent = document.getElementById(parentId);
        const child = document.getElementById(childId);
        if (!parent || !child) return;
        const p = getCenter(parent, 'bottom');
        const c = getCenter(child, 'top');
        const midY = p.y + (c.y - p.y) / 2;
        addLine(p.x, p.y, p.x, midY);
        addLine(p.x, midY, c.x, midY);
        addLine(c.x, midY, c.x, c.y);
      }

      drawTree('n-kimi', ['n-chatgpt', 'n-claudecode']);
      drawTree('n-chatgpt', ['n-qa', 'n-writer']);
      drawTree('n-chatgpt', ['n-merchant', 'n-personal', 'n-affiliate', 'n-paydirect']);
      drawTree('n-claudecode', ['n-merchant', 'n-personal', 'n-affiliate', 'n-paydirect']);
      drawDirect('n-affiliate', 'n-social-affiliate');
      drawDirect('n-paydirect', 'n-social-paydirect');
    }

    drawConnectors();
    window.addEventListener('resize', drawConnectors);
    // Redraw after layout settles (font load, images, etc.)
    const t = setTimeout(drawConnectors, 100);
    return () => {
      window.removeEventListener('resize', drawConnectors);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="org-chart-wrap" style={{ minHeight: '100vh' }}>
      <style jsx>{`
        .org-chart-wrap {
          --bg-2: #151821;
          --ink: #e9ebf0;
          --ink-dim: #8a8f9c;
          --line: #2a2f3d;
          --accent: #ffb000;
          --accent-2: #7cc5ff;
          --accent-3: #f07178;
          --accent-4: #a3e635;
          --social: #c084fc;
          background-image:
            radial-gradient(circle at 15% 10%, rgba(255, 176, 0, 0.05), transparent 40%),
            radial-gradient(circle at 85% 90%, rgba(124, 197, 255, 0.05), transparent 40%);
          font-family: var(--font-mono);
          color: var(--ink);
          padding: 16px 0;
        }
        .header {
          border-bottom: 1px solid var(--line);
          padding-bottom: 20px;
          margin-bottom: 40px;
        }
        .eyebrow {
          font-size: 11px;
          letter-spacing: 0.3em;
          color: var(--accent);
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        h1 {
          font-family: var(--font-heading);
          font-weight: 400;
          font-size: clamp(28px, 4.5vw, 48px);
          letter-spacing: -0.02em;
          line-height: 1.05;
        }
        h1 em {
          font-style: italic;
          color: var(--accent);
        }
        .sub {
          color: var(--ink-dim);
          margin-top: 10px;
          font-size: 12px;
          max-width: 750px;
        }
        .chart {
          position: relative;
          padding: 20px 0;
          overflow-x: auto;
        }
        .chart svg.connectors {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }
        .row {
          position: relative;
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 80px;
          z-index: 1;
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .row:last-child {
          margin-bottom: 0;
        }
        .node {
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 14px 18px;
          min-width: 200px;
          max-width: 270px;
          position: relative;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          z-index: 2;
        }
        .node:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }
        .role {
          font-size: 9px;
          letter-spacing: 0.2em;
          color: var(--ink-dim);
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .name {
          font-family: var(--font-heading);
          font-size: 17px;
          font-weight: 500;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .desc {
          font-size: 10px;
          color: var(--ink-dim);
          margin-top: 4px;
          line-height: 1.4;
        }
        .model {
          font-size: 10px;
          color: var(--accent);
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px dashed var(--line);
        }
        .orchestrator {
          border: 2px solid var(--accent);
          background: linear-gradient(180deg, rgba(255, 176, 0, 0.08), var(--bg-2));
          min-width: 260px;
          text-align: center;
        }
        .orchestrator .role {
          color: var(--accent);
        }
        .pm,
        .coder-shared {
          border: 2px solid var(--accent-2);
          background: linear-gradient(180deg, rgba(124, 197, 255, 0.06), var(--bg-2));
          text-align: center;
          min-width: 220px;
        }
        .pm .role,
        .coder-shared .role {
          color: var(--accent-2);
        }
        .shared {
          border-left: 3px solid var(--accent-3);
        }
        .shared .role {
          color: var(--accent-3);
        }
        .project {
          border-top: 3px solid var(--accent-4);
          text-align: left;
          min-width: 260px;
          max-width: 290px;
        }
        .project .role {
          color: var(--accent-4);
        }
        .project-emerald {
          border-top-color: #34d399;
        }
        .project-emerald .role {
          color: #34d399;
        }
        .project-orange {
          border-top-color: #fb923c;
        }
        .project-orange .role {
          color: #fb923c;
        }
        .subs {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px dashed var(--line);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .subs-label {
          font-size: 8px;
          letter-spacing: 0.25em;
          color: var(--ink-dim);
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .sub-agent {
          background: #0e1014;
          border: 1px solid var(--line);
          border-radius: 4px;
          padding: 8px 10px;
          font-size: 11px;
          transition: border-color 0.2s ease;
        }
        .sub-agent:hover {
          border-color: var(--accent-4);
        }
        .sub-name {
          color: var(--ink);
          font-weight: 500;
        }
        .sub-desc {
          color: var(--ink-dim);
          font-size: 9px;
          margin-top: 2px;
        }
        .social-node {
          border: 1px solid var(--social);
          border-left: 3px solid var(--social);
          background: linear-gradient(180deg, rgba(192, 132, 252, 0.05), var(--bg-2));
          min-width: 200px;
          max-width: 240px;
        }
        .social-node .role {
          color: var(--social);
        }
        .channel-chip {
          background: #0e1014;
          border: 1px solid var(--line);
          border-left: 2px solid var(--social);
          border-radius: 3px;
          padding: 6px 9px;
          font-size: 10.5px;
          color: var(--ink);
          transition: border-color 0.15s ease;
        }
        .channel-chip:hover {
          border-color: var(--social);
        }
        .empty-note {
          font-size: 10px;
          color: var(--ink-dim);
          font-style: italic;
          text-align: center;
          padding: 12px 8px;
          border: 1px dashed var(--line);
          border-radius: 4px;
          margin-top: 8px;
        }
        .legend {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid var(--line);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
          font-size: 11px;
          color: var(--ink-dim);
        }
        .legend-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }
        .legend-item strong {
          color: var(--ink);
          display: block;
        }
        .footer-note {
          margin-top: 28px;
          font-size: 10px;
          color: var(--ink-dim);
          text-align: center;
          letter-spacing: 0.05em;
        }
        @media (max-width: 1100px) {
          .row {
            gap: 14px;
            margin-bottom: 60px;
          }
          .chart svg.connectors {
            display: none;
          }
        }
      `}</style>

      <div className="header">
        <div className="eyebrow">System Architecture · v1.4</div>
        <h1>
          Agent <em>Organization</em> Chart
        </h1>
        <p className="sub">
          Hierarchical multi-agent structure. Orchestrator routes to two peer leads. Shared QA &amp; Writer support all four projects.
          Affiliate Flow and PayDirect each own their own Social Media agent so channels never get crossed.
        </p>
      </div>

      <div className="chart" id="chart" ref={chartRef}>
        <svg className="connectors" id="connectors" ref={svgRef} />

        {/* TIER 1 */}
        <div className="row" data-tier="1">
          <div className="node orchestrator" id="n-kimi">
            <div className="role">Orchestrator · Mouthpiece</div>
            <div className="name">Kimi</div>
            <div className="desc">
              Only mouthpiece — relays information to other sub-agents and constantly checks all agents are doing their job. Speaks to me on
              Telegram. Goes to other agents for everything.
            </div>
            <div className="model">Model: Kimi</div>
          </div>
        </div>

        {/* TIER 2 */}
        <div className="row" data-tier="2">
          <div className="node pm" id="n-chatgpt">
            <div className="role">Program Manager</div>
            <div className="name">ChatGPT</div>
            <div className="desc">Formulates prompts &amp; task specs</div>
            <div className="model">Model: ChatGPT</div>
          </div>
          <div className="node coder-shared" id="n-claudecode">
            <div className="role">Coder</div>
            <div className="name">Claude Code</div>
            <div className="desc">All technical build tasks</div>
            <div className="model">Model: Claude Opus 4.6</div>
          </div>
        </div>

        {/* TIER 3 */}
        <div className="row" data-tier="3">
          <div className="node shared" id="n-qa">
            <div className="role">QA · Shared</div>
            <div className="name">QA Agent</div>
            <div className="desc">Review, test, verify outputs</div>
            <div className="model">Model: Claude Opus 4.6 / local</div>
          </div>
          <div className="node shared" id="n-writer">
            <div className="role">Writer · Shared</div>
            <div className="name">Writer Agent</div>
            <div className="desc">Copy, captions, long-form</div>
            <div className="model">Model: ChatGPT</div>
          </div>
        </div>

        {/* TIER 4: PROJECTS */}
        <div className="row" data-tier="4">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`node project ${p.accent === 'emerald' ? 'project-emerald' : p.accent === 'orange' ? 'project-orange' : ''}`}
              id={p.id}
              style={{ borderTopColor: ACCENT_TOP[p.accent] }}
            >
              <div className="role" style={{ color: ACCENT_TOP[p.accent] }}>
                Project
              </div>
              <div className="name">{p.name}</div>
              <div className="desc">{p.desc}</div>

              <div className="subs">
                <div className="subs-label">Sub-agents</div>
                {p.subs.length === 0 ? (
                  <div className="empty-note">No agents yet — workflow undefined</div>
                ) : (
                  p.subs.map((s) => (
                    <div key={s.name} className="sub-agent">
                      <div className="sub-name">{s.name}</div>
                      {s.desc && <div className="sub-desc">{s.desc}</div>}
                    </div>
                  ))
                )}
              </div>

              <div className="subs" style={{ marginTop: 8 }}>
                <div className="subs-label" style={{ color: '#fbbf24' }}>
                  ⏱ Cron Jobs
                </div>
                <div className="empty-note">
                  Will populate from real phase docs. Org-chart cron list was aspirational — extracting actual jobs from
                  <code> .planning/phases/</code> next.
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* TIER 5: SOCIAL */}
        <div className="row" data-tier="5">
          {projects
            .filter((p) => p.social)
            .map((p) => (
              <div key={p.social!.id} className="node social-node" id={p.social!.id}>
                <div className="role">Social Media · {p.name.split(' ')[0]}</div>
                <div className="name">Social Agent</div>
                <div className="desc">Channels owned by {p.name}</div>
                <div className="subs">
                  <div className="subs-label">Channels</div>
                  {p.social!.channels.map((ch) => (
                    <div key={ch} className="channel-chip">
                      ▸ {ch}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ffb000' }} />
          <div>
            <strong>Orchestration</strong>Top-level routing
          </div>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#7cc5ff' }} />
          <div>
            <strong>Leads (peers)</strong>PM + Coder
          </div>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#f07178' }} />
          <div>
            <strong>Shared Support</strong>Reused across projects
          </div>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#a3e635' }} />
          <div>
            <strong>Projects</strong>Vertical workflows
          </div>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#c084fc' }} />
          <div>
            <strong>Social Agents</strong>Project-scoped, per channel
          </div>
        </div>
      </div>

      <div className="footer-note">
        Each project owns its own social channels — no cross-mixing between Affiliate Flow&apos;s audience and PayDirect&apos;s.
      </div>
    </div>
  );
}
