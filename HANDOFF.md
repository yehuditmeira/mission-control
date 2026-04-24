# HANDOFF — mission-control

**Last updated:** 2026-04-24 evening (Friday, before Shabbat) by Claude
**Branch:** main
**Latest commits:**
- `523953e` feat(kanban): phase view + project tree + Today filter + phase management
- `1caaa31` chore(hourly): wire markdown importer into hourly maintenance cron
- `e215867` feat(importer): auto-import checkbox tasks from HANDOFF.md + OPEN_ITEMS.md
- `a1c6278` feat(db): sub-project hierarchy + tree seed
- `af1c3b2` feat(db): project_phases table + task phase/labels/source columns
- `5e4ea9e` chore: bring Kanban/Timeline + scripts to main

---

## What landed today (in plain English)

You asked OC to build a Kanban for Mission Control. He claimed it was done — it wasn't. I dug in, found the truth, fixed it for real, and rebuilt it the way you actually wanted.

### 1. Fixed the lying
- Found the wip-merger had a 60-second build timeout that was failing silently. Mission Control's build takes longer than 60s, so it kept saying "BLOCKED build failed" — but the code was actually fine. **Raised it to 300s and made it log the real error.**
- Gave you the rule to paste into OC so he can't claim "done" without proof again. He used it — the next thing he sent was honest ("NOT DONE — files missing").

### 2. Got OC's stranded work onto main
- His Kanban + Timeline pages and his refresh scripts were stuck on a branch. Merged them all to `main`, pushed, build passed.

### 3. Made the hourly auto-refresh actually run
- macOS was blocking launchd from running scripts in `~/Desktop/`. Moved scripts to `~/Library/Scripts/mission-control/` and logs to `~/Library/Logs/mission-control/`. Hourly job now exits cleanly every run.

### 4. Built Kanban v2 the way you wanted
- New Supabase tables and columns (migration 000007 + 000008): per-project editable phases, parent/child sub-projects, task labels, markdown source tracking.
- Sub-projects seeded from your brain dump:
  - **Merchant Lead Hunter:** Reddit (archived), Nutripay, New Restaurants
  - **Mrkt Drop:** Social Platforms, Website, Partnerships
  - **Personal Assistant:** Social Voices (cross-project bucket)
  - **PayDirect:** flat (one track)
- **Markdown importer.** Reads `OPEN_ITEMS.md` and every `HANDOFF.md`, picks up `- [ ]` lines, creates tasks. `- [x]` lines auto-close them. **24 tasks already imported.** Runs every hour automatically.
- **New Kanban features at `/kanban`:**
  - Project tree picker (sub-projects indented under their parents)
  - **Workflow ↔ Phases** view toggle
  - **Today** pill — filters to tasks due today, like Mission Control bossing you around
  - Drag a card to a different phase column → it saves
  - Cards show due-today/overdue badges + labels
- **New page at `/admin/phases`** — add, rename, reorder, archive phases per project. So when Mrkt Drop's phases stop making sense, you can rename them yourself instead of asking me.

---

## What you can do right now

1. **Open Mission Control → `/kanban`.** You'll see 24 real tasks scraped from your notes.
2. **Pick a project from the dropdown.** Try Merchant Lead Hunter — you'll see Reddit/Nutripay/New Restaurants under it.
3. **Click "Phases" toggle.** The columns become that project's phases.
4. **Click "Today" pill.** Only tasks due today.
5. **Click "Manage phases"** when a project is picked. Rename anything that doesn't make sense.

---

## What's NOT done yet

- **Adding new tasks from the Kanban UI itself** — there's no "+ Add task" button on the board yet. You can add tasks from `/tasks` page or by writing `- [ ] thing` into your `OPEN_ITEMS.md` (importer picks them up within an hour).
- **Editing a task's labels/phase from the card itself** — drag-to-phase works, but no inline label editing. Open the task in `/tasks` page to edit details.
- **The hourly job still has one quirk** — when scripts in `~/Library/Scripts/mission-control/` change, you have to manually copy them from the repo. Future improvement: make this automatic.
- **Mrkt Drop's old top-level phases are archived** — phases now live on each sub-project. If you don't like that, tell me and I'll restore them.

---

## Phase names you'll probably want to rename

I picked sensible defaults but didn't ask. Edit at `/admin/phases`:

| Sub-project | Current phases | Probably should be |
|---|---|---|
| Reddit | Backlog/Active/Done | (archived, doesn't matter) |
| Nutripay | Backlog/Active/Done | Outreach / Demo / Onboarded? |
| New Restaurants | Backlog/Active/Done | Prospecting / Pitch / Closed? |
| Social Platforms | Launch/Traffic/Monetize/Scale | (your call) |
| Website | Backlog/Active/Done | (your call) |
| Partnerships | Backlog/Active/Done | Outreach / Negotiating / Signed? |
| Social Voices | Backlog/Active/Done | Discovery / Build / Live? |

---

## How to pick up
1. `git -C /Users/katespencer/Desktop/AI_Folder/mission-control status` — should be clean
2. Open the live site, hit `/kanban`, see the new toolbar
3. If something looks wrong: every change I made is in commits `5e4ea9e..523953e`. `git log --oneline 5e4ea9e..` to see them all.
4. Read `/Users/katespencer/Documents/Obsidian Vault/Agent-Shared/decisions-log.md` for recent cross-agent context.

---

## Files touched today

- `supabase/migrations/000007_kanban_phases.sql`
- `supabase/migrations/000008_subprojects.sql`
- `scripts/import_tasks_from_md.mjs`
- `scripts/hourly_maintenance.sh` (synced to `~/Library/Scripts/mission-control/`)
- `lib/types.ts`
- `app/api/projects/route.ts`
- `app/api/tasks/route.ts`
- `app/api/tasks/[id]/route.ts`
- `app/api/phases/route.ts` (new)
- `app/api/phases/[id]/route.ts` (new)
- `app/kanban/page.tsx`
- `app/admin/phases/page.tsx` (new)
- `~/.claude/hooks/kk-wip-merger.sh` (60s → 300s timeout + real error logging)
- `~/Library/LaunchAgents/com.katespencer.mission-control-hourly.plist`
- `~/Library/Scripts/mission-control/` (scripts moved here so launchd can run them)
- `~/Library/Logs/mission-control/` (logs moved here so launchd can write them)
