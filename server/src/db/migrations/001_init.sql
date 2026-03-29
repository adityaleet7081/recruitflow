CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS companies (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                   VARCHAR(255) NOT NULL,
  slug                   VARCHAR(255) UNIQUE NOT NULL,
  plan                   VARCHAR(50) NOT NULL DEFAULT 'free',
  stripe_customer_id     VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'recruiter',
  refresh_token TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by   UUID NOT NULL REFERENCES users(id),
  title        VARCHAR(255) NOT NULL,
  description  TEXT NOT NULL,
  requirements TEXT,
  location     VARCHAR(255),
  salary_min   INTEGER,
  salary_max   INTEGER,
  job_type     VARCHAR(50) DEFAULT 'full-time',
  status       VARCHAR(50) NOT NULL DEFAULT 'open',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id         UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(50),
  resume_url     TEXT,
  resume_text    TEXT,
  pipeline_stage VARCHAR(50) NOT NULL DEFAULT 'applied',
  ai_score       INTEGER,
  ai_analysis    JSONB,
  notes          TEXT,
  source         VARCHAR(100),
  applied_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  sent_by      UUID REFERENCES users(id),
  subject      VARCHAR(500) NOT NULL,
  body         TEXT,
  status       VARCHAR(50) NOT NULL DEFAULT 'sent',
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_company    ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company     ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job   ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_stage ON candidates(pipeline_stage);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();