# Mission Control — Build Plan

## Overview
A Notion/Asana hybrid productivity app. Simple, clean, local-first. Built with Next.js + SQLite + Tailwind + shadcn/ui.

## Projects System
- Default projects: Merchant Services, Affiliate Flow, Personal
- User can add/remove projects
- Every item (task, note, event) belongs to a project or is "unassigned"
- All views support "all projects" or filter by single project

---

## Phase 1: Foundation & Core Layout
- [ ] Initialize Next.js app with TypeScript, Tailwind, shadcn/ui
- [ ] Set up SQLite database with better-sqlite3
- [ ] Create DB schema (projects, tasks, subtasks, notes, events, cron_jobs, memory_logs)
- [ ] Build app shell — sidebar navigation, project switcher, main content area
- [ ] Responsive layout with clean sidebar

## Phase 2: Tasks & To-Do
- [ ] Task list view with status (todo/in-progress/done), priority, due date
- [ ] Subtasks under each task with progress tracking
- [ ] "Author" field — user or AI (for collaborative to-do)
- [ ] Filter/sort by project, status, priority, due date

## Phase 3: Kanban Board
- [ ] Drag-and-drop kanban columns (Backlog, To Do, In Progress, Done)
- [ ] Cards show task title, project tag, priority, due date
- [ ] Project filter toggle (all vs single project)
- [ ] Moving cards updates task status

## Phase 4: Notes
- [ ] Note editor with markdown support
- [ ] Notes organized by project
- [ ] Simple list/grid view of notes
- [ ] Search notes

## Phase 5: Gantt Timeline
- [ ] Horizontal timeline view of tasks with start/end dates
- [ ] Color-coded by project
- [ ] Filter by project or show all
- [ ] Click to edit task dates

## Phase 6: Calendar
- [ ] Monthly/weekly calendar view
- [ ] Shows: cron jobs (recurring), task due dates, custom events
- [ ] Add events manually (commitments, deadlines, accountability items)
- [ ] Color-coded by project

## Phase 7: Cron Jobs Viewer
- [ ] List of all cron jobs with schedule, description, last run, status
- [ ] Read from actual cron configurations where possible
- [ ] Manual entry for tracking external crons

## Phase 8: Memory Logs
- [ ] Browse daily memory summaries by date
- [ ] Read from memory/ directory files
- [ ] Search across logs
- [ ] Clean date-based navigation

---

## Review
(To be filled after implementation)
