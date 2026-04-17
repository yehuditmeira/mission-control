-- Seed demo data for all 3 projects

-- Get project IDs
WITH project_ids AS (
  SELECT 
    (SELECT id FROM projects WHERE slug = 'personal') as personal_id,
    (SELECT id FROM projects WHERE slug = 'merchant-lead-hunter') as mlh_id,
    (SELECT id FROM projects WHERE slug = 'mrkt-drop') as mrkt_id
),

-- Insert Personal tasks
personal_tasks AS (
  INSERT INTO tasks (project_id, title, description, status, priority, due_date, start_date)
  SELECT 
    project_ids.personal_id,
    data.title,
    data.description,
    data.status,
    data.priority,
    data.due_date,
    data.start_date
  FROM project_ids,
  LATERAL (VALUES
    ('Review weekly goals', 'Go through obsidian weekly review template', 'todo', 'medium', 
     NOW() + INTERVAL '2 days', NOW()),
    ('Schedule dentist appointment', 'Call Dr. Smith for annual cleaning', 'backlog', 'low',
     NOW() + INTERVAL '14 days', NULL),
    ('Buy groceries', 'Weekly shopping - check fridge first', 'done', 'medium',
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
    ('Plan weekend trip', 'Research destinations within 2 hours drive', 'in_progress', 'high',
     NOW() + INTERVAL '7 days', NOW())
  ) AS data(title, description, status, priority, due_date, start_date)
)

-- Insert Merchant Lead Hunter tasks
SELECT * FROM (
  INSERT INTO tasks (project_id, title, description, status, priority, due_date, start_date)
  SELECT 
    p.mlh_id,
    data.title,
    data.description,
    data.status,
    data.priority,
    data.due_date,
    data.start_date
  FROM (SELECT id AS mlh_id FROM projects WHERE slug = 'merchant-lead-hunter') p,
  LATERAL (VALUES
    ('Fix Reddit DM rate limiting', 'Current 429 errors on bulk outreach - need backoff strategy', 
     'in_progress', 'urgent', NOW() + INTERVAL '3 days', NOW()),
    ('Add sentiment analysis to AI qualification', 'Better qualify leads before sending DMs', 
     'backlog', 'medium', NOW() + INTERVAL '10 days', NULL),
    ('Update SMS provider to Telnyx', 'Twilio costs too high, migrate to Telnyx', 
     'todo', 'high', NOW() + INTERVAL '5 days', NOW()),
    ('Test v1.1 Reddit approval flow', 'New approval system before DMs are sent', 
     'in_progress', 'high', NOW() + INTERVAL '2 days', NOW()),
    ('Create commission tracking dashboard', 'Show Ziv closed deals and residuals', 
     'backlog', 'low', NOW() + INTERVAL '21 days', NULL)
  ) AS data(title, description, status, priority, due_date, start_date)
  RETURNING *
) mlh_tasks;

-- Insert Mrkt Drop tasks (marketing platform setup)
WITH mrkt_id AS (SELECT id FROM projects WHERE slug = 'mrkt-drop')
INSERT INTO tasks (project_id, title, description, status, priority, due_date, start_date)
SELECT 
  mrkt_id.id,
  data.title,
  data.description,
  data.status,
  data.priority,
  data.due_date,
  data.start_date
FROM mrkt_id,
LATERAL (VALUES
  ('Pinterest: Set up Business Account', 'Convert personal Pinterest to business account', 
   'done', 'high', '2025-04-21'::TIMESTAMPTZ + INTERVAL '2 days', '2025-04-21'),
  ('Pinterest: Create 10 boards', 'Set up niche boards for modest fashion', 
   'in_progress', 'high', '2025-04-28', '2025-04-21'),
  ('SEO: Keyword research for spring drop', 'Find 20 high-volume keywords', 
   'todo', 'medium', '2025-05-05', '2025-04-28'),
  ('Instagram: Design 5 story templates', 'Create reusable Canva templates', 
   'backlog', 'medium', '2025-05-12', '2025-05-05'),
  ('WhatsApp: Set up broadcast list', 'Configure WhatsApp Business for updates', 
   'backlog', 'low', '2025-05-19', '2025-05-12'),
  ('TikTok: Film first outfit video', 'Get tripod, practice transitions', 
   'backlog', 'low', '2025-05-26', '2025-05-19')
) AS data(title, description, status, priority, due_date, start_date);

-- Insert some demo events
WITH project_ids AS (
  SELECT 
    (SELECT id FROM projects WHERE slug = 'personal') as personal_id,
    (SELECT id FROM projects WHERE slug = 'merchant-lead-hunter') as mlh_id,
    (SELECT id FROM projects WHERE slug = 'mrkt-drop') as mrkt_id
)
INSERT INTO events (project_id, title, description, start_datetime, all_day, color)
SELECT 
  data.project_id,
  data.title,
  data.description,
  data.start_datetime,
  data.all_day,
  data.color
FROM project_ids,
LATERAL (VALUES
  (project_ids.personal_id, 'Doctor Appointment', 'Annual physical', 
   NOW() + INTERVAL '7 days', false, '#F59E0B'),
  (project_ids.personal_id, 'Family Dinner', 'At parents'' house', 
   NOW() + INTERVAL '3 days', true, '#F59E0B'),
  (project_ids.mlh_id, 'Ziv Sync Call', 'Review merchant leads pipeline', 
   NOW() + INTERVAL '2 days', false, '#EC4899'),
  (project_ids.mlh_id, 'v1.1 Launch', 'Reddit approval flow goes live for testing', 
   '2025-04-18'::TIMESTAMPTZ, true, '#EC4899'),
  (project_ids.mrkt_id, 'Pinterest Phase 1 Complete', 'Foundation setup finished', 
   '2025-04-28'::TIMESTAMPTZ, true, '#A855F7'),
  (project_ids.mrkt_id, 'SEO/Blog Phase 1 Start', 'Begin content engine foundation', 
   '2025-04-28'::TIMESTAMPTZ, true, '#A855F7')
) AS data(project_id, title, description, start_datetime, all_day, color);

-- Insert demo notes
WITH project_ids AS (
  SELECT 
    (SELECT id FROM projects WHERE slug = 'personal') as personal_id,
    (SELECT id FROM projects WHERE slug = 'merchant-lead-hunter') as mlh_id,
    (SELECT id FROM projects WHERE slug = 'mrkt-drop') as mrkt_id
)
INSERT INTO notes (project_id, title, content, pinned)
SELECT 
  data.project_id,
  data.title,
  data.content,
  data.pinned
FROM project_ids,
LATERAL (VALUES
  (project_ids.personal_id, 'Weekly Meal Plan', 
   E'Sunday: Pasta\nMonday: Chicken\nTuesday: Fish\nWednesday: Leftovers\nThursday: Takeout\nFriday: Shabbat dinner\nSaturday: Shabbat lunch', 
   false),
  (project_ids.mlh_id, 'Reddit Subreddits to Monitor', 
   E'r/smallbusiness\nr/Entrepreneur\nr/square\nr/stripe\nr/merchantservices', 
   true),
  (project_ids.mrkt_id, 'Pinterest Board Ideas', 
   E'Modest Fashion\nShabbos Outfits\nSimcha Dresses\nWorkwear Chic\nSummer Tznius\nFall Layers', 
   true),
  (project_ids.personal_id, 'Books to Read', 
   E'The Effective Executive - Peter Drucker\nEssentialism - Greg McKeown\nAtomic Habits - James Clear', 
   false)
) AS data(project_id, title, content, pinned);
