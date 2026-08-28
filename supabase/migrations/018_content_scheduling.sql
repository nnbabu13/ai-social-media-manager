-- Phase 15: Content Calendar + Scheduling + Publishing

-- 1. Content schedules
CREATE TABLE IF NOT EXISTS content_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  scheduled_at_utc TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'publishing', 'published', 'failed', 'cancelled', 'missed'
  )),
  provider TEXT,
  provider_post_id TEXT,
  published_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_schedules_item ON content_schedules(content_item_id);
CREATE INDEX IF NOT EXISTS idx_content_schedules_account ON content_schedules(social_account_id);
CREATE INDEX IF NOT EXISTS idx_content_schedules_status ON content_schedules(status);
CREATE INDEX IF NOT EXISTS idx_content_schedules_scheduled_at ON content_schedules(scheduled_at_utc);

-- 2. Content publish jobs
CREATE TABLE IF NOT EXISTS content_publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_schedule_id UUID NOT NULL REFERENCES content_schedules(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'processing', 'published', 'failed', 'cancelled'
  )),
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  error_type TEXT,
  provider_post_id TEXT,
  idempotency_key TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_schedule ON content_publish_jobs(content_schedule_id);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_status ON content_publish_jobs(status);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_idempotency ON content_publish_jobs(idempotency_key);

-- 3. Add content version tracking columns
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS approved_by UUID;

-- 4. Update content_items status to include scheduled/publishing/published
-- (already handled by CHECK constraint update in trigger below)

-- 5. Function to update content_schedules.updated_at
CREATE OR REPLACE FUNCTION update_content_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_schedules_updated_at
  BEFORE UPDATE ON content_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_content_schedules_updated_at();

CREATE TRIGGER content_publish_jobs_updated_at
  BEFORE UPDATE ON content_publish_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_content_schedules_updated_at();
