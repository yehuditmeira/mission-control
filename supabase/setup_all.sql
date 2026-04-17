-- COMPLETE SETUP: Run this entire file in Supabase SQL Editor
-- This sets up the multi-project dashboard with renamed projects

-- =====================================================
-- PART 1: Update existing project names and structure
-- =====================================================

-- Add missing columns to projects table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'slug') THEN
    ALTER TABLE projects ADD COLUMN slug TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'description') THEN
    ALTER TABLE projects ADD COLUMN description TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'sort_order') THEN
    ALTER TABLE projects ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update project names and add slugs
UPDATE projects SET
  name = 'Personal',
  slug = 'personal',
  color = '#F59E0B',
  sort_order = 0,
  description = 'Personal tasks and life admin'
WHERE name IN ('Personal', 'Mission Control');

UPDATE projects SET
  name = 'Merchant Lead Hunter',
  slug = 'merchant-lead-hunter',
  color = '#EC4899',
  sort_order = 1,
  description = 'Reddit scraper → AI qualification → DM outreach for merchant services'
WHERE name = 'Merchant Services';

UPDATE projects SET
  name = 'Mrkt Drop',
  slug = 'mrkt-drop',
  color = '#A855F7',
  sort_order = 2,
  description = 'Autonomous social media marketing for 7 platforms'
WHERE name = 'Affiliate Flow';

-- Insert projects if they don't exist
INSERT INTO projects (name, color, slug, sort_order, description)
SELECT * FROM (VALUES
  ('Personal', '#F59E0B', 'personal', 0, 'Personal tasks and life admin'),
  ('Merchant Lead Hunter', '#EC4899', 'merchant-lead-hunter', 1, 'Reddit scraper → AI qualification → DM outreach'),
  ('Mrkt Drop', '#A855F7', 'mrkt-drop', 2, 'Autonomous social media marketing for 7 platforms')
) AS v(name, color, slug, sort_order, description)
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = v.name);

-- =====================================================
-- PART 2: Insert demo tasks if tables are empty
-- =====================================================

DO $$
DECLARE
  personal_id INTEGER;
  mlh_id INTEGER;
  mrkt_id INTEGER;
BEGIN
  SELECT id INTO personal_id FROM projects WHERE slug = 'personal' LIMIT 1;
  SELECT id INTO mlh_id FROM projects WHERE slug = 'merchant-lead-hunter' LIMIT 1;
  SELECT id INTO mrkt_id FROM projects WHERE slug = 'mrkt-drop' LIMIT 1;

  -- Only seed if tasks table is empty
  IF NOT EXISTS (SELECT 1 FROM tasks LIMIT 1) THEN
    
    -- Personal tasks
    INSERT INTO tasks (project_id, title, description, status, priority) VALUES
    (personal_id, 'Review weekly goals', 'Go through obsidian weekly review template', 'todo', 'medium'),
    (personal_id, 'Schedule dentist appointment', 'Call for annual cleaning', 'backlog', 'low'),
    (personal_id, 'Buy groceries', 'Weekly shopping - check fridge first', 'done', 'medium'),
    (personal_id, 'Plan weekend trip', 'Research destinations within 2 hours drive', 'in_progress', 'high');

    -- Merchant Lead Hunter tasks  
    INSERT INTO tasks (project_id, title, description, status, priority) VALUES
    (mlh_id, 'Fix Reddit DM rate limiting', 'Current 429 errors on bulk outreach', 'in_progress', 'urgent'),
    (mlh_id, 'Add sentiment analysis', 'Better qualify leads before sending DMs', 'backlog', 'medium'),
    (mlh_id, 'Update SMS provider to Telnyx', 'Twilio costs too high, migrate', 'todo', 'high'),
    (mlh_id, 'Test v1.1 Reddit approval flow', 'New approval system before DMs', 'in_progress', 'high');

    -- Mrkt Drop tasks
    INSERT INTO tasks (project_id, title, description, status, priority, due_date) VALUES
    (mrkt_id, 'Pinterest: Set up Business Account', 'Convert personal Pinterest to business', 'done', 'high', NOW() + INTERVAL '2 days'),
    (mrkt_id, 'Pinterest: Create 10 boards', 'Set up niche boards for modest fashion', 'in_progress', 'high', NOW() + INTERVAL '7 days'),
    (mrkt_id, 'SEO: Keyword research', 'Find 20 high-volume keywords', 'todo', 'medium', NOW() + INTERVAL '14 days'),
    (mrkt_id, 'Instagram: Design 5 story templates', 'Create reusable Canva templates', 'backlog', 'medium', NOW() + INTERVAL '21 days');

  END IF;

  -- Seed events if empty
  IF NOT EXISTS (SELECT 1 FROM events LIMIT 1) THEN
    INSERT INTO events (project_id, title, description, start_datetime, all_day, color) VALUES
    (personal_id, 'Doctor Appointment', 'Annual physical', NOW() + INTERVAL '7 days', false, '#F59E0B'),
    (mlh_id, 'Ziv Sync Call', 'Review merchant leads pipeline', NOW() + INTERVAL '2 days', false, '#EC4899'),
    (mrkt_id, 'Pinterest Phase 1 Complete', 'Foundation setup finished', NOW() + INTERVAL '14 days', true, '#A855F7');
  END IF;

END $$;

-- Ensure project_id columns exist on related tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'project_id') THEN
    ALTER TABLE tasks ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'project_id') THEN
    ALTER TABLE events ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'project_id') THEN
    ALTER TABLE notes ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Fix any NULL project_ids
UPDATE tasks SET project_id = (SELECT id FROM projects WHERE slug = 'personal') WHERE project_id IS NULL;
UPDATE events SET project_id = (SELECT id FROM projects WHERE slug = 'personal') WHERE project_id IS NULL;
UPDATE notes SET project_id = (SELECT id FROM projects WHERE slug = 'personal') WHERE project_id IS NULL;

SELECT 'Setup complete!' as status;
