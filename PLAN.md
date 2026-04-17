# Mission Control Dashboard — Build Plan

## 1. What Exists Now

**Stack:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Supabase (PostgreSQL), deployed on Vercel.

**Current pages:**
- `/` — Dashboard homepage (light theme, hardcoded Mrkt Drop platform timeline + status cards)
- `/tasks` — Task list with project filtering
- `/kanban` — Kanban board view
- `/gantt` — Gantt/timeline view
- `/calendar` — Calendar events
- `/cron` — Cron jobs table (label, schedule, source, status — **no last-run or error tracking**)
- `/notes` — Notes with rich editor (Tiptap)
- `/notes/[id]` — Single note editor
- `/memory` — Memory log viewer
- `/workspace` — Workspace view
- `/platforms` — Platform automation cards (Mrkt Drop-specific: Pinterest, SEO, Instagram, etc.)

**Components:**
- `Sidebar` — Fixed left nav (240px), light neutral theme, nav links + project tabs for kanban/gantt
- `ProjectTabs` — Fetches projects from API, renders as sidebar list
- `ProjectSwitcher` — Dropdown project filter

**API routes:** Full CRUD for projects, tasks, subtasks, notes, events, cron-jobs, platforms, platform-tasks, recurring-jobs, content-items, memory-logs, stats.

**Data models:** Project, Task, Subtask, Note, Event, CronJob, Platform, PlatformTask, RecurringJob, ContentItem — all in Supabase.

**Design:** Currently light theme (white/neutral-50 backgrounds). Uses Inter font. No dark theme. No per-project accent colors.

---

## 2. What Needs to Be Built

### Theme Overhaul
- [ ] Dark theme: `#0e1014` (base), `#151821` (cards/surfaces)
- [ ] Typography: Fraunces (headings) + JetBrains Mono (data/code)
- [ ] Per-project accent colors:
  - Affiliate Flow (Mrkt Drop): `#8B5CF6` (purple)
  - Lead Hunter: `#F59E0B` (amber)
  - PayDirect: `#10B981` (emerald)
  - Personal Assistant: `#3B82F6` (blue)

### Multi-Project Dashboard (redesign `/`)
- [ ] Project cards grid — each card shows: name, accent color, status badge, phase progress bar, key metric, last activity timestamp
- [ ] Quick-action buttons per card (open project, view tasks, view timeline)
- [ ] Summary stats row (total tasks, active phases, cron health, agents running)

### Expandable Sidebar — Agent Activity
- [ ] Redesign sidebar with dark theme
- [ ] Collapsible project sections — click project name to expand
- [ ] Per-project agent activity feed: agent name, current action, status indicator (idle/running/error), last heartbeat
- [ ] Real-time pulse animation for active agents
- [ ] Data source: new `agent_activity` table or API endpoint polling agent logs

### Unified GSD Timeline
- [ ] New page `/timeline` — horizontal timeline showing all GSD phases across all projects
- [ ] Color-coded by project accent
- [ ] Phase cards: phase number, name, status (planned/active/complete), date range
- [ ] Filterable by project
- [ ] Data source: reads from `.planning/` directories or a new `gsd_phases` table

### Cron Jobs Page (enhance existing `/cron`)
- [ ] Add columns: `last_run_at`, `last_run_status`, `last_run_duration`, `last_error`
- [ ] Status indicators: green pulse (healthy), yellow (warning), red (failed)
- [ ] Error detail expandable row
- [ ] "Run Now" button (manual trigger)
- [ ] Data: extend `cron_jobs` table or join with `recurring_jobs` (which already has `last_run_at`, `last_run_status`, `last_run_output`)

### 2D Agent Office
- [ ] New page `/agents` — canvas/CSS-based cartoon office
- [ ] Agent characters: small illustrated avatars (CSS/SVG)
- [ ] Idle animation: agents wander, sit at desks, chat with each other
- [ ] Active animation: agent moves to workstation, typing indicator, status bubble
- [ ] Agent roster: Claude (orchestrator), Cron Runner, Content Generator, Analytics Bot, Lead Scraper
- [ ] Click agent to see current task, recent activity, logs
- [ ] Lightweight — CSS animations + requestAnimationFrame, no heavy canvas library

### Organization Tree
- [ ] New page `/org` — visual tree of the business structure
- [ ] Root: "Kate Spencer" (CEO/operator)
- [ ] Branches: Products (Affiliate Flow, Lead Hunter, PayDirect) → Agents per product → Cron jobs per agent
- [ ] Interactive: click node to see details, expand/collapse branches
- [ ] Render with CSS flexbox/grid tree layout (no external lib needed)

### Docs Repository
- [ ] New page `/docs` — searchable doc viewer
- [ ] Sources: reads markdown files from project directories (CLAUDE.md, AGENTS.md, SOUL.md, IDENTITY.md, etc.)
- [ ] Categories: Architecture, Agents, Workflows, SOPs, Project Docs
- [ ] Markdown renderer (can reuse Tiptap or use `react-markdown`)
- [ ] Search bar with title/content filtering

---

## 3. Recommended Build Order

Build in dependency order — each phase delivers a usable increment.

### Phase 1: Dark Theme + Typography Foundation
**Why first:** Every subsequent page inherits the design system. Do this once, apply everywhere.
- Update `globals.css` with dark theme CSS variables
- Add Fraunces + JetBrains Mono via `next/font/google`
- Update `layout.tsx` with new fonts
- Update `tailwind.config.ts` with project accent colors
- Restyle Sidebar (dark)
- Verify all existing pages render correctly with dark theme

**Estimated scope:** ~5 files changed

### Phase 2: Multi-Project Dashboard
**Why second:** The landing page sets the tone. Project cards become the navigation hub.
- Ensure 4 projects exist in Supabase (Affiliate Flow, Lead Hunter, PayDirect, Personal Assistant)
- Redesign `app/page.tsx` — project cards grid with accent colors
- Add summary stats row
- Wire to existing `/api/projects` and `/api/stats`

**Estimated scope:** ~2 files changed, 1 new component

### Phase 3: Sidebar Agent Activity
**Why third:** Sidebar is visible on every page — high leverage.
- Create `agent_activity` table in Supabase (or mock data initially)
- Create `/api/agent-activity` endpoint
- Redesign `components/sidebar.tsx` with expandable project sections
- Add agent activity feed per project
- Polling or Supabase realtime subscription

**Estimated scope:** ~3 files changed, 1 new API route, 1 migration

### Phase 4: Enhanced Cron Jobs
**Why fourth:** Cron page exists, just needs enrichment. Quick win.
- Merge `cron_jobs` display with `recurring_jobs` data (which already tracks last_run info)
- Add last-run, status, error columns to the table
- Add expandable error detail row
- Add health indicator badges
- Optional: "Run Now" button

**Estimated scope:** ~2 files changed

### Phase 5: Unified GSD Timeline
**Why fifth:** Cross-project visibility. Needs data aggregation.
- Create `/app/timeline/page.tsx`
- Create `/api/gsd-phases` that reads phase data (from DB or filesystem)
- Horizontal scrolling timeline with project color coding
- Phase cards with status
- Add to sidebar nav

**Estimated scope:** ~3 new files

### Phase 6: Docs Repository
**Why sixth:** Low complexity, high utility. Surfaces existing docs.
- Create `/app/docs/page.tsx`
- Create `/api/docs` that reads markdown files from known paths
- Markdown renderer component
- Search/filter by title and category
- Add to sidebar nav

**Estimated scope:** ~3 new files

### Phase 7: Organization Tree
**Why seventh:** Informational page, moderate complexity.
- Create `/app/org/page.tsx`
- Hardcoded tree structure (or driven from projects + agents data)
- CSS-based tree layout with expand/collapse
- Click-to-detail panels
- Add to sidebar nav

**Estimated scope:** ~2 new files

### Phase 8: 2D Agent Office
**Why last:** Most creative/complex. Fun feature but lowest priority for revenue.
- Create `/app/agents/page.tsx`
- Design agent SVG avatars (5-6 characters)
- CSS animation system (idle wandering, active working)
- Agent state integration (pull from agent_activity)
- Click-to-inspect interaction
- Add to sidebar nav

**Estimated scope:** ~3 new files, SVG assets

---

## Architecture Notes

**No new dependencies needed** for phases 1-7. Phase 8 may benefit from a lightweight animation helper but CSS-only is preferred.

**Database changes:**
- Phase 3 needs an `agent_activity` table
- Phase 5 may need a `gsd_phases` table (or filesystem reads)
- Phase 4 can reuse existing `recurring_jobs` table

**Existing API coverage:** Projects, tasks, cron-jobs, platforms, and stats APIs already exist. Most new pages just need a new page component + possibly one API route.

**Font loading:** Use `next/font/google` for both Fraunces and JetBrains Mono. Apply via CSS variables for clean inheritance.
