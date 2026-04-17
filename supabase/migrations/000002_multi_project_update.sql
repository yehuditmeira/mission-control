-- Multi-project update: Rename projects and add necessary schema changes
-- Projects renamed: Affiliate Flow -> Mrkt Drop, Merchant Services -> Merchant Lead Hunter

-- Projects table already exists from initial migration
-- Update existing project names if migration was applied, otherwise we'll handle in seed

-- Add slug column to projects for cleaner URLs (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'slug') THEN
    ALTER TABLE projects ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Add description column to projects (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'description') THEN
    ALTER TABLE projects ADD COLUMN description TEXT;
  END IF;
END $$;

-- Create unique constraint on slug if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_slug_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_projects_slug_unique ON projects(slug) WHERE slug IS NOT NULL;
  END IF;
END $$;

-- Insert or update the three main projects
-- Note: Using INSERT ON CONFLICT for idempotent updates

-- Personal project (new)
INSERT INTO projects (name, color, slug, sort_order, description)
VALUES ('Personal', '#F59E0B', 'personal', 0, 'Personal tasks and life admin')
ON CONFLICT (name) DO UPDATE SET
  color = EXCLUDED.color,
  slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description;

-- Merchant Lead Hunter (was Merchant Services)
INSERT INTO projects (name, color, slug, sort_order, description)
VALUES ('Merchant Lead Hunter', '#EC4899', 'merchant-lead-hunter', 1, 'Reddit scraper → AI qualification → DM outreach for merchant services')
ON CONFLICT (name) DO UPDATE SET
  color = EXCLUDED.color,
  slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description;

-- Mrkt Drop (was Affiliate Flow)
INSERT INTO projects (name, color, slug, sort_order, description)
VALUES ('Mrkt Drop', '#A855F7', 'mrkt-drop', 2, 'Autonomous social media marketing for 7 platforms')
ON CONFLICT (name) DO UPDATE SET
  color = EXCLUDED.color,
  slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description;

-- Remove old project names if they exist (cleanup)
DELETE FROM projects WHERE name IN ('Affiliate Flow', 'Merchant Services', 'Mission Control');

-- Ensure all tasks have a valid project_id by associating unassigned tasks to Personal
UPDATE tasks SET project_id = (SELECT id FROM projects WHERE slug = 'personal')
WHERE project_id IS NULL OR project_id NOT IN (SELECT id FROM projects);

-- Same for events, notes, cron_jobs
UPDATE events SET project_id = (SELECT id FROM projects WHERE slug = 'personal')
WHERE project_id IS NULL OR project_id NOT IN (SELECT id FROM projects);

UPDATE notes SET project_id = (SELECT id FROM projects WHERE slug = 'personal')
WHERE project_id IS NULL OR project_id NOT IN (SELECT id FROM projects);

UPDATE cron_jobs SET project_id = (SELECT id FROM projects WHERE slug = 'personal')
WHERE project_id IS NULL OR project_id NOT IN (SELECT id FROM projects);

-- Add project_id relationship to platforms table for platform-specific project association
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platforms' AND column_name = 'project_id') THEN
    ALTER TABLE platforms ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Assign all existing platforms to Mrkt Drop (they're marketing platforms)
UPDATE platforms SET project_id = (SELECT id FROM projects WHERE slug = 'mrkt-drop')
WHERE project_id IS NULL;

-- Create index for faster project-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_platforms_project ON platforms(project_id);
