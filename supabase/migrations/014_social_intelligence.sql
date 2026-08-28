-- Phase 13: Social Intelligence Engine

-- 1. Social observations
CREATE TABLE IF NOT EXISTS social_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
  observation_type TEXT NOT NULL CHECK (observation_type IN (
    'performance_change', 'content_pattern', 'audience_signal', 'customer_question',
    'potential_lead', 'complaint', 'sentiment_change', 'engagement_spike',
    'engagement_drop', 'content_opportunity', 'competitor_signal', 'posting_gap',
    'conversion_signal', 'account_health', 'strategy_drift', 'faq_gap',
    'sensitive_topic', 'spam'
  )),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('urgent', 'high', 'medium', 'low', 'info')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  source_ids JSONB DEFAULT '[]',
  confidence REAL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'dismissed', 'expired')),
  signature TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_observations_business ON social_observations(business_id);
CREATE INDEX IF NOT EXISTS idx_social_observations_account ON social_observations(social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_observations_type ON social_observations(observation_type);
CREATE INDEX IF NOT EXISTS idx_social_observations_severity ON social_observations(severity);
CREATE INDEX IF NOT EXISTS idx_social_observations_status ON social_observations(status);
CREATE INDEX IF NOT EXISTS idx_social_observations_signature ON social_observations(signature);
CREATE INDEX IF NOT EXISTS idx_social_observations_expires ON social_observations(expires_at);

-- 2. Social recommendations
CREATE TABLE IF NOT EXISTS social_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  observation_id UUID REFERENCES social_observations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'create_content', 'follow_up_content', 'respond_to_customer', 'review_lead',
    'investigate_issue', 'change_content_mix', 'increase_topic_frequency',
    'decrease_topic_frequency', 'review_strategy', 'connect_account', 'other'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'info')),
  confidence REAL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'dismissed', 'accepted', 'completed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_recommendations_business ON social_recommendations(business_id);
CREATE INDEX IF NOT EXISTS idx_social_recommendations_observation ON social_recommendations(observation_id);
CREATE INDEX IF NOT EXISTS idx_social_recommendations_status ON social_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_social_recommendations_priority ON social_recommendations(priority);

-- 3. Social content classifications
CREATE TABLE IF NOT EXISTS social_content_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  social_post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  pillar TEXT,
  objective TEXT,
  audience TEXT,
  format TEXT,
  product TEXT,
  cta TEXT,
  promotional BOOLEAN DEFAULT false,
  confidence REAL DEFAULT 0.5,
  raw_classification JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(social_post_id)
);

CREATE INDEX IF NOT EXISTS idx_social_content_classifications_business ON social_content_classifications(business_id);
CREATE INDEX IF NOT EXISTS idx_social_content_classifications_post ON social_content_classifications(social_post_id);

-- 4. Social leads
CREATE TABLE IF NOT EXISTS social_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform_user_id TEXT NOT NULL,
  name TEXT,
  username TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('comment', 'dm', 'mention')),
  source_reference TEXT,
  intent TEXT NOT NULL CHECK (intent IN ('high', 'medium', 'low')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'qualified', 'contacted', 'converted', 'ignored')),
  confidence REAL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_leads_business ON social_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_social_leads_account ON social_leads(social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_leads_status ON social_leads(status);
CREATE INDEX IF NOT EXISTS idx_social_leads_intent ON social_leads(intent);

-- 5. Social interactions (classified comments/messages)
CREATE TABLE IF NOT EXISTS social_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  social_comment_id UUID REFERENCES social_comments(id) ON DELETE SET NULL,
  platform_user_id TEXT,
  user_name TEXT,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'positive', 'neutral', 'question', 'purchase_intent', 'complaint',
    'spam', 'partnership', 'support_request', 'other'
  )),
  classification TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,
  reason TEXT,
  priority TEXT DEFAULT 'low' CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'info')),
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_interactions_business ON social_interactions(business_id);
CREATE INDEX IF NOT EXISTS idx_social_interactions_account ON social_interactions(social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_interactions_type ON social_interactions(interaction_type);

-- 6. Scan jobs
CREATE TABLE IF NOT EXISTS social_scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('manual', 'scheduled')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  observations_created INTEGER DEFAULT 0,
  recommendations_created INTEGER DEFAULT 0,
  leads_created INTEGER DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_scan_jobs_business ON social_scan_jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_social_scan_jobs_status ON social_scan_jobs(status);

-- 7. Observation deduplication signatures
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_observations_unique_signature
ON social_observations(business_id, signature)
WHERE signature IS NOT NULL;

-- 8. Update triggers
CREATE OR REPLACE FUNCTION update_social_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_recommendations_updated_at
  BEFORE UPDATE ON social_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_social_intelligence_updated_at();

CREATE TRIGGER social_leads_updated_at
  BEFORE UPDATE ON social_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_social_intelligence_updated_at();
