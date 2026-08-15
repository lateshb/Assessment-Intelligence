-- Add visibility column to rubric_library
-- Migration: 20260815000004_add_rubric_visibility.sql

-- Add visibility column with enum constraint
ALTER TABLE rubric_library
ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'
CHECK (visibility IN ('private', 'institution'));

-- Create index for institution rubric queries
CREATE INDEX idx_rubric_library_institution_visibility 
ON rubric_library(institution_id, visibility, owner_id);

-- Update RLS policies for visibility-based access

-- Drop existing SELECT policy and recreate with visibility logic
DROP POLICY IF EXISTS "Users can view rubrics in their institution" ON rubric_library;

CREATE POLICY "Users can view rubrics in their institution" ON rubric_library
FOR SELECT
USING (
  -- Owner can always see their own rubrics
  owner_id = auth.uid()
  OR
  -- Institution members can see institution-visible rubrics
  (
    visibility = 'institution' 
    AND institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
  )
);

-- Owner can update/delete only their own rubrics (unchanged)
-- INSERT policy remains unchanged (owner_id set on insert)
