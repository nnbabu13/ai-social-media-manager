CREATE TABLE IF NOT EXISTS business_profiling_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_screen INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE business_profiling_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business profiling sessions"
  ON business_profiling_sessions FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their business profiling sessions"
  ON business_profiling_sessions FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their business profiling sessions"
  ON business_profiling_sessions FOR UPDATE
  USING (business_id IN (
    SELECT business_id FROM business_members WHERE user_id = auth.uid()
  ));

-- Add extra columns to customer_personas if they don't exist
DO $$ BEGIN
  ALTER TABLE customer_personas ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'primary';
  ALTER TABLE customer_personas ADD COLUMN IF NOT EXISTS segments JSONB DEFAULT '[]';
  ALTER TABLE customer_personas ADD COLUMN IF NOT EXISTS buying_triggers JSONB DEFAULT '[]';
  ALTER TABLE customer_personas ADD COLUMN IF NOT EXISTS objections JSONB DEFAULT '[]';
  ALTER TABLE customer_personas ADD COLUMN IF NOT EXISTS content_interests JSONB DEFAULT '[]';
  ALTER TABLE customer_personas ADD COLUMN IF NOT EXISTS preferred_channels JSONB DEFAULT '[]';
  ALTER TABLE customer_personas ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2) DEFAULT 0.7;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
