-- Migration 003: AI Skill Assessments

-- One assessment config per job
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  time_limit_minutes INTEGER DEFAULT 30,
  questions JSONB,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id)
);

-- One row per candidate who was sent an assessment
CREATE TABLE IF NOT EXISTS candidate_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  token UUID UNIQUE DEFAULT gen_random_uuid(),
  status VARCHAR(20) DEFAULT 'pending',
  answers JSONB,
  ai_score INTEGER,
  ai_feedback JSONB,
  ai_summary TEXT,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_assessments_token
  ON candidate_assessments(token);

CREATE INDEX IF NOT EXISTS idx_candidate_assessments_candidate
  ON candidate_assessments(candidate_id);