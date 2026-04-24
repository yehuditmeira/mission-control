-- 000008_subprojects.sql
-- Sub-project support. Adds self-referential parent_project_id to projects,
-- archived_at for soft-archiving (Reddit done, no longer active), and seeds
-- the sub-project tree from Yomy's brain dump.
--
-- Tree:
--   Merchant Lead Hunter
--     ├── Reddit (archived)
--     ├── Nutripay
--     └── New Restaurants
--   Mrkt Drop
--     ├── Social Platforms
--     ├── Website
--     └── Partnerships
--   Personal Assistant
--     └── Social Voices
--   PayDirect (flat, no sub-projects)
--   Personal (flat, no sub-projects)

BEGIN;

-- 1. Schema: parent_project_id + archived_at
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS parent_project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_project_id);

-- 2. Seed sub-projects
INSERT INTO projects (name, color, sort_order, parent_project_id, archived_at) VALUES
  ('Reddit',           '#F26522', 1, 6, NOW()),
  ('Nutripay',         '#10B981', 2, 6, NULL),
  ('New Restaurants',  '#F59E0B', 3, 6, NULL),
  ('Social Platforms', '#EC4899', 1, 7, NULL),
  ('Website',          '#3B82F6', 2, 7, NULL),
  ('Partnerships',     '#8B5CF6', 3, 7, NULL),
  ('Social Voices',    '#06B6D4', 1, 9, NULL)
ON CONFLICT (name) DO NOTHING;

-- 3. Archive Mrkt Drop's top-level phases (they apply to sub-projects now)
UPDATE project_phases SET archived_at = NOW()
  WHERE project_id = 7 AND archived_at IS NULL;

-- 4. Seed phases for new sub-projects
-- Social Platforms gets Yomy's explicit Launch/Traffic/Monetize/Scale.
-- Everything else gets generic Backlog/Active/Done — she can rename via the UI.
INSERT INTO project_phases (project_id, name, sort_order)
SELECT p.id, ph.name, ph.sort_order FROM projects p
CROSS JOIN (VALUES
  ('Launch', 1), ('Traffic', 2), ('Monetize', 3), ('Scale', 4)
) AS ph(name, sort_order)
WHERE p.name = 'Social Platforms'
ON CONFLICT (project_id, name) DO NOTHING;

INSERT INTO project_phases (project_id, name, sort_order)
SELECT p.id, ph.name, ph.sort_order FROM projects p
CROSS JOIN (VALUES
  ('Backlog', 1), ('Active', 2), ('Done', 3)
) AS ph(name, sort_order)
WHERE p.name IN ('Reddit', 'Nutripay', 'New Restaurants', 'Website', 'Partnerships', 'Social Voices')
ON CONFLICT (project_id, name) DO NOTHING;

COMMIT;
