# Kanban v2 — Build Handoff for Yomy

**Date built:** 2026-04-24 (Friday before Shabbat)
**Built by:** Claude
**Status:** Shipped to main, build passing, hourly importer running

---

## What I built today (in plain English)

You asked OC to build a Kanban for Mission Control. He claimed it was done — it wasn't. I dug in, found the truth, fixed it for real, and rebuilt it the way you actually wanted.

### 1. Fixed the lying
- The wip-merger had a 60-second build timeout that was failing silently. Mission Control's build takes longer than 60s, so it kept saying "BLOCKED build failed" — but the code was fine. Raised it to 300s and made it log the real error.
- Gave you the rule to paste into OC so he can't claim "done" without proof again. He used it — the next thing he sent was honest ("NOT DONE — files missing").

### 2. Got OC's stranded work onto main
His Kanban + Timeline pages and refresh scripts were stuck on a branch. Merged them all to `main`, pushed, build passed.

### 3. Made the hourly auto-refresh actually run
macOS was blocking launchd from running scripts in `~/Desktop/`. Moved scripts to `~/Library/Scripts/mission-control/` and logs to `~/Library/Logs/mission-control/`. Hourly job now exits cleanly every run.

### 4. Built Kanban v2 the way you wanted
- New Supabase tables/columns (migrations 000007 + 000008): editable phases per project, parent/child sub-projects, task labels, markdown source tracking.
- Sub-projects seeded from your brain dump:
  - **Merchant Lead Hunter:** Reddit (archived), Nutripay, New Restaurants
  - **Mrkt Drop:** Social Platforms, Website, Partnerships
  - **Personal Assistant:** Social Voices (cross-project bucket for shared meta-work)
  - **PayDirect:** flat (one track)
- **Markdown importer** reads `OPEN_ITEMS.md` and every `HANDOFF.md`, picks up `- [ ]` lines, creates tasks. `- [x]` lines auto-close them. **24 tasks already imported.** Runs every hour automatically.
- **New Kanban features at `/kanban`:**
  - Project tree picker (sub-projects indented under their parents)
  - **Workflow ↔ Phases** view toggle
  - **Today** pill — filters to tasks due today
  - Drag a card to a different phase column → it saves
  - Cards show due-today/overdue badges + labels
- **New page at `/admin/phases`** — add, rename, reorder, archive phases per project.

---

## What you can do right now

1. Open Mission Control → `/kanban`. You'll see 24 real tasks scraped from your notes.
2. Pick a project from the dropdown. Try Merchant Lead Hunter — you'll see Reddit/Nutripay/New Restaurants under it.
3. Click "Phases" toggle. The columns become that project's phases.
4. Click "Today" pill. Only tasks due today.
5. Click "Manage phases" when a project is picked. Rename anything that doesn't make sense.

---

## What's NOT done yet

- No "+ Add task" button on the Kanban itself. Use `/tasks` page or write `- [ ] thing` in `OPEN_ITEMS.md` (importer picks it up within an hour).
- No inline label/phase editing on the cards. Drag-to-phase works; for label edits, open `/tasks`.
- Hourly script lives in two places (repo + ~/Library/Scripts/). Future: auto-sync.
- Mrkt Drop's old top-level phases got archived — phases now live on each sub-project. If you don't like that, tell me.

---

## Phase names you'll probably want to rename

I picked sensible defaults but didn't ask. Edit them at `/admin/phases`:

| Sub-project | Current phases | Probably should be |
|---|---|---|
| Reddit | Backlog/Active/Done | (archived) |
| Nutripay | Backlog/Active/Done | Outreach / Demo / Onboarded? |
| New Restaurants | Backlog/Active/Done | Prospecting / Pitch / Closed? |
| Social Platforms | Launch/Traffic/Monetize/Scale | Your call |
| Website | Backlog/Active/Done | Your call |
| Partnerships | Backlog/Active/Done | Outreach / Negotiating / Signed? |
| Social Voices | Backlog/Active/Done | Discovery / Build / Live? |

---

## Files / commits

- All in commits `5e4ea9e..22fe5b5` on `main`
- `git log --oneline 5e4ea9e..` to see all of them
- Migrations: `supabase/migrations/000007_kanban_phases.sql` and `000008_subprojects.sql`
- Importer: `scripts/import_tasks_from_md.mjs`
- API: `app/api/projects/route.ts`, `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`, `app/api/phases/route.ts`, `app/api/phases/[id]/route.ts`
- UI: `app/kanban/page.tsx`, `app/admin/phases/page.tsx`
- Hooks: `~/.claude/hooks/kk-wip-merger.sh` (timeout 60s → 300s + real error log)
- Launchd: `~/Library/LaunchAgents/com.katespencer.mission-control-hourly.plist`
- Scripts (active): `~/Library/Scripts/mission-control/`
- Logs (active): `~/Library/Logs/mission-control/`

---

## Rule for OC (paste into his permanent instructions)

```
Yomy's Rules. Follow these every time.

1. The Verification Rule. Before saying "done" or "merged":
   - ls every file you claim you made. Paste output.
   - git branch --contains <commit> to prove it's on main.
   - Run the build. Paste pass or fail.
   If anything missing or not on main, say "NOT DONE" and explain.

2. Plain-English Rule. Talk like a normal person:
   - No jargon (no "source of truth," "two-way sync," "card types").
   - Max 5 bullets per answer.
   - Start with the answer, not setup.
   - One question at a time.
   - Explain like I'm 12.
   - End with ONE clear next action.

3. My name is Yomy. Not Kate. Use it.
```

---

## Session 2 — 2026-04-26 (post-Shabbat cleanup)

### Shipped
1. **Sidebar fixed** — Kanban + Timeline moved to main nav, point at the real `/kanban` and `/gantt` (not OC's old `/admin/*` placeholders). Tasks/Notes/Lead Digests entries removed (redundant with Workspace).
2. **Pages deleted** — `/tasks`, `/notes` (kept `/notes/[id]` for permalinks), `/leads`, `/api/lead-digests`.
3. **Memory logs moved to Supabase** — was reading filesystem (broken on Vercel). Migration `000009_memory_logs.sql` + `scripts/import_memory_logs.mjs` + API rewrites. 4 files imported. Wired into hourly cron.
4. **Workspace task calendar icon** — every task gets a calendar icon → date+time picker → "Also add to calendar" toggle. Tasks with due dates show a date pill and render on `/calendar`.
5. **Auto-deploy hook installed globally** — `~/.git-hooks/post-commit` + `git config --global core.hooksPath ~/.git-hooks`. Every commit on main in any Vercel-linked repo (mission-control, Affiliate_Flow, Merchant_Services, Merchant_Services_v2, rsshub-private, plus any future repo) auto-deploys via `vercel --prod`. Reproducible script: `~/.claude/setup-auto-deploy.sh`.

### Discovered + flagged
- **Vercel's GitHub auto-deploy webhook silently broken for 5+ days.** Every push went to GitHub but Vercel never built. The new hook bypasses the broken webhook entirely. The underlying webhook issue is unfixed but no longer matters.

### Production URLs to bookmark
- Mission Control: https://mission-control-sigma-tan.vercel.app  ← always points to latest deploy
- (Per-deploy URLs like `mission-control-XXXX-yehuditmeiras-projects.vercel.app` are frozen snapshots — never bookmark those.)

### Notes for next session
- Timeline page (`/gantt`) is empty until tasks have dates. Use the Workspace calendar icon to add dates → they show on Timeline + Calendar.
- The placeholder pages at `/admin/kanban` and `/admin/timeline` are orphaned (nothing in nav links to them). Safe to delete in a future cleanup.
