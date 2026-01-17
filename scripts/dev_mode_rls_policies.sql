-- Migration: Add Anonymous RLS Policies for Dev Mode Testing
-- Purpose: Allow local development without OAuth by permitting anonymous access
-- Security Note: These policies are for development convenience. Remove after wedding if desired.

-- Allow anonymous SELECT on parties (for dev testing)
CREATE POLICY "Allow anonymous select for testing"
ON parties FOR SELECT
TO anon
USING (true);

-- Allow anonymous operations on game_completions
CREATE POLICY "Allow anonymous select on game_completions"
ON game_completions FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous insert on game_completions"
ON game_completions FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous operations on quiz_submissions
CREATE POLICY "Allow anonymous select on quiz_submissions"
ON quiz_submissions FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous insert on quiz_submissions"
ON quiz_submissions FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous update on quiz_submissions"
ON quiz_submissions FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
