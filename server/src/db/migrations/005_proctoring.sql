-- Migration 005: Add violations tracking to candidate_assessments
ALTER TABLE candidate_assessments
ADD COLUMN IF NOT EXISTS violations JSONB DEFAULT '[]'::jsonb;