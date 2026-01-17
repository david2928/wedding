-- =====================================================
-- Wedding Games Gamification - Database Migration
-- =====================================================
-- Run this script in Supabase SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- 1. CREATE TABLES
-- =====================================================

-- game_stations: Define available games/activities
CREATE TABLE IF NOT EXISTS game_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,  -- lucide-react icon name
  requires_upload BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- game_completions: Track which parties completed which games
CREATE TABLE IF NOT EXISTS game_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
  station_id TEXT REFERENCES game_stations(station_id) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_by_google_id TEXT,
  photo_url TEXT,  -- For sunset photo uploads
  notes TEXT,
  UNIQUE(party_id, station_id)
);

-- quiz_questions: Trivia questions about the couple
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  points INTEGER DEFAULT 10,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- quiz_submissions: Track quiz attempts (one per party)
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE UNIQUE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  time_taken_seconds INTEGER,  -- For leaderboard tiebreaker
  answers JSONB,  -- Store answers as {"question_id": "A", ...}
  submitted_by_google_id TEXT
);

-- 2. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_game_completions_party ON game_completions(party_id);
CREATE INDEX IF NOT EXISTS idx_game_completions_station ON game_completions(station_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_score ON quiz_submissions(total_score DESC, time_taken_seconds ASC);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON quiz_questions(is_active, display_order);

-- 3. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE game_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

-- game_stations: Anyone can read active stations
DROP POLICY IF EXISTS "Anyone can read active stations" ON game_stations;
CREATE POLICY "Anyone can read active stations"
ON game_stations FOR SELECT
USING (is_active = TRUE);

-- game_completions: Users can view and insert for their own party
DROP POLICY IF EXISTS "Users can view their party completions" ON game_completions;
CREATE POLICY "Users can view their party completions"
ON game_completions FOR SELECT
USING (
  party_id IN (
    SELECT id FROM parties WHERE google_user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can complete games for their party" ON game_completions;
CREATE POLICY "Users can complete games for their party"
ON game_completions FOR INSERT
WITH CHECK (
  party_id IN (
    SELECT id FROM parties WHERE google_user_id = auth.uid()::text
  )
);

-- quiz_questions: Anyone can read active questions
DROP POLICY IF EXISTS "Anyone can read active questions" ON quiz_questions;
CREATE POLICY "Anyone can read active questions"
ON quiz_questions FOR SELECT
USING (is_active = TRUE);

-- quiz_submissions: Users can view and insert for their own party
DROP POLICY IF EXISTS "Users can view their party quiz" ON quiz_submissions;
CREATE POLICY "Users can view their party quiz"
ON quiz_submissions FOR SELECT
USING (
  party_id IN (
    SELECT id FROM parties WHERE google_user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can submit quiz for their party once" ON quiz_submissions;
CREATE POLICY "Users can submit quiz for their party once"
ON quiz_submissions FOR INSERT
WITH CHECK (
  party_id IN (
    SELECT id FROM parties WHERE google_user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can update their incomplete quiz" ON quiz_submissions;
CREATE POLICY "Users can update their incomplete quiz"
ON quiz_submissions FOR UPDATE
USING (
  party_id IN (
    SELECT id FROM parties WHERE google_user_id = auth.uid()::text
  )
  AND completed_at IS NULL
)
WITH CHECK (
  party_id IN (
    SELECT id FROM parties WHERE google_user_id = auth.uid()::text
  )
);

-- 4. SEED GAME STATIONS
-- =====================================================

INSERT INTO game_stations (station_id, name, description, icon, requires_upload, is_active, display_order) VALUES
('sunset', 'Capture the Sunset', 'Upload a beautiful sunset photo from the wedding', 'Sunset', TRUE, TRUE, 1),
('golf', 'Golf Champion', 'Make 3 putts in a row at our mini golf station', 'Target', FALSE, TRUE, 2),
('portrait', 'Portrait Time', 'Have our artist draw your portrait', 'Palette', FALSE, TRUE, 3),
('audio', 'Voice Message', 'Leave us a heartfelt audio message', 'Mic', FALSE, TRUE, 4),
('placeholder5', 'Coming Soon', 'More activities to be announced!', 'HelpCircle', FALSE, FALSE, 5),
('placeholder6', 'Coming Soon', 'More activities to be announced!', 'HelpCircle', FALSE, FALSE, 6)
ON CONFLICT (station_id) DO NOTHING;

-- 5. SEED QUIZ QUESTIONS (Placeholder - Edit these!)
-- =====================================================

INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, points, display_order, is_active) VALUES
('Where did David and Chanika first meet?', 'At a coffee shop', 'Through mutual friends', 'At work', 'On a dating app', 'B', 10, 1, TRUE),
('What is the wedding date?', 'January 30, 2026', 'January 31, 2026', 'February 1, 2026', 'February 14, 2026', 'B', 10, 2, TRUE),
('Where is the wedding taking place?', 'Banyan Tree Phuket', 'COMO Point Yamu', 'Six Senses Yao Noi', 'Amanpuri', 'B', 10, 3, TRUE),
('What is David''s favorite hobby?', 'Golf', 'Cooking', 'Photography', 'Hiking', 'A', 10, 4, TRUE),
('What is Chanika''s favorite color?', 'Blue', 'Pink', 'Purple', 'Green', 'A', 10, 5, TRUE),
('How many years have David and Chanika been together?', '2 years', '3 years', '4 years', '5 years', 'B', 10, 6, TRUE),
('What is their favorite travel destination?', 'Paris', 'Tokyo', 'Phuket', 'New York', 'C', 10, 7, TRUE),
('What is David''s profession?', 'Engineer', 'Doctor', 'Teacher', 'Business', 'A', 10, 8, TRUE),
('What is their favorite cuisine?', 'Italian', 'Thai', 'Japanese', 'Mexican', 'B', 10, 9, TRUE),
('What month did David propose?', 'January', 'March', 'June', 'December', 'D', 10, 10, TRUE)
ON CONFLICT DO NOTHING;

-- 6. CREATE LEADERBOARD VIEW
-- =====================================================

CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id as party_id,
  p.name as party_name,
  p.from_side,
  qs.total_score,
  qs.total_questions,
  qs.time_taken_seconds,
  qs.completed_at,
  (SELECT COUNT(*) FROM game_completions gc WHERE gc.party_id = p.id) as games_completed,
  ROW_NUMBER() OVER (ORDER BY qs.total_score DESC, qs.time_taken_seconds ASC) as rank
FROM quiz_submissions qs
JOIN parties p ON p.id = qs.party_id
WHERE qs.completed_at IS NOT NULL
ORDER BY qs.total_score DESC, qs.time_taken_seconds ASC;

-- Grant read access to leaderboard view
GRANT SELECT ON leaderboard TO authenticated, anon;

-- 7. STORAGE BUCKET SETUP
-- =====================================================
-- NOTE: You need to create the storage bucket manually in Supabase Dashboard
-- Go to: Storage > Create Bucket
--
-- Bucket Configuration:
-- - Name: sunset-photos
-- - Public: NO (private bucket)
-- - File size limit: 10485760 (10 MB)
-- - Allowed MIME types: image/jpeg,image/png,image/webp
--
-- Then run the storage policy below:

-- Storage policies for sunset-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('sunset-photos', 'sunset-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY IF NOT EXISTS "Users can upload sunset photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sunset-photos'
  AND auth.uid() IS NOT NULL
);

-- Allow users to view their own party's photos
CREATE POLICY IF NOT EXISTS "Users can view their party photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'sunset-photos');

-- Allow users to update their own uploads
CREATE POLICY IF NOT EXISTS "Users can update their uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'sunset-photos' AND auth.uid() IS NOT NULL);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Update src/lib/supabase/types.ts with new table types
-- 2. Edit quiz questions with real questions about David & Chanika
-- 3. Start building the frontend components
