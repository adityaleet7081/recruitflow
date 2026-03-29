-- Migration 004: Add assessment_score to candidates table
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS assessment_score INTEGER DEFAULT NULL;