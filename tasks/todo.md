# Mission Control — Live Data + Visual Refresh

## Goal
Mission Control dashboard shows REAL phase data, dates, and agent activity from
the actual `.planning/` directories of every project — no mock data — and the
org chart matches the canonical structure from claude.ai.

## Plan

### Phase A — Unbreak production (5 min)
- [ ] A1. Pull `vercel logs` for the latest deployment to confirm the 500 root cause.
- [ ] A2. Verify Supabase env vars are present in Vercel for the `mission-control` project (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- [ ] A3. Verify the `project_sync` table/view exists on the live Supabase DB. If missing, create it via `supabase/setup_all.sql`.
- [ ] A4. Add safe-fallback to `/api/sync` so a missing table returns `{ projects: [] }` instead of a 500. Page already renders empty-state when `projects` is empty.

### Phase B — Live phase data (the main ask)
- [ ] B1. Run `npm run sync` locally to populate `project_sync` from real `.planning/STATE.md` files for affiliate-flow, lead-hunter, paydirect (no-op), personal-assistant.
- [ ] B2. Extend `sync-to-db.js` to also write a `project_phases` row per phase (id, name, status, milestone, last_modified). Currently it writes only the rolled-up state.
- [ ] B3. Add `/api/phases?project=<id>` endpoint that returns all phases for a project, sorted by phase number.
- [ ] B4. Update home page project cards to show: current milestone, current phase, next 2 phases, last updated date.
- [ ] B5. Wire `/gantt` page to render phases on a real timeline using `last_modified` dates and `status` (shipped / in_progress / not_started). No fake dates.
- [ ] B6. Add "Tasks", "Calendar", "Cron Jobs" tiles on home that show real counts (already-existing API routes).

### Phase C — Org chart matching claude.ai
- [ ] C1. Kate to share the canonical org chart (screenshot or describe it). Right now `/org` has Yomy → Kimi → (ChatGPT, Claude Code) → projects. I need her version.
- [ ] C2. Update `app/org/page.tsx` `orgTree` constant to match.
- [ ] C3. Surface the org chart on the home dashboard (small embedded preview), not just the `/org` page.

### Phase D — Open Claw / agent activity feed
- [ ] D1. Confirm what "Open Claw" is. Candidates: ClaudeClaw Telegram bot, henry-cron, henry-voice, competitor-monitor, parallel-prompts. Or an agent runtime I haven't found.
- [ ] D2. Identify its log/event source (file? sqlite? API?).
- [ ] D3. Add `/api/agent-activity` endpoint that reads recent agent runs (timestamp, project, agent name, action, status).
- [ ] D4. Add a live "Agent Activity" feed panel on the home dashboard showing last N events across all projects.

### Phase E — Polish + ship
- [ ] E1. Make all date displays absolute when hovered (tooltip with full ISO).
- [ ] E2. Remove all hardcoded mock arrays (`agentsByProject` in sidebar, etc.) once D is wired.
- [ ] E3. Build + deploy to production.
- [ ] E4. Verify each page loads on production.

## Open questions for Kate
1. **Org chart** — Can you share/describe the chart from claude.ai? Even a screenshot or 5-line text is enough.
2. **Open Claw** — What is this? A folder? A Telegram bot? An agent log file? Where do its events live on disk or in a DB?
3. **Dates** — Your `.planning/` files have "last_updated" but no target/due dates per phase. Do you want me to (a) just use last-updated as the timeline anchor, or (b) add a `target_date` field to phase frontmatter so I can show real upcoming dates?
4. **paydirect** has no `.planning/`. Should I scaffold one, hide the project until it has data, or display "Not started"?
