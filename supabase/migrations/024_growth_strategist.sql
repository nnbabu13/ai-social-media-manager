-- Phase 18: AI Growth Strategist + Performance Intelligence Engine

-- 1. Content Performance Snapshots
CREATE TABLE IF NOT EXISTS content_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  social_post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metrics JSONB NOT NULL DEFAULT '{}',
  data_source TEXT DEFAULT 'platform',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perf_snapshots_business ON content_performance_snapshots(business_id);
CREATE INDEX IF NOT EXISTS idx_perf_snapshots_post ON content_performance_snapshots(social_post_id);
CREATE INDEX IF NOT EXISTS idx_perf_snapshots_date ON content_performance_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_perf_snapshots_content_item ON content_performance_snapshots(content_item_id);

-- 2. Growth Insights
CREATE TABLE IF NOT EXISTS growth_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'performance', 'content', 'audience', 'lead', 'conversion',
    'strategy', 'platform', 'opportunity', 'risk'
  )),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  confidence REAL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'info')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'accepted', 'rejected', 'implemented', 'expired')),
  data_through TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  brain_version INTEGER,
  strategy_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_insights_business ON growth_insights(business_id);
CREATE INDEX IF NOT EXISTS idx_growth_insights_type ON growth_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_growth_insights_status ON growth_insights(status);
CREATE INDEX IF NOT EXISTS idx_growth_insights_priority ON growth_insights(priority);
CREATE INDEX IF NOT EXISTS idx_growth_insights_created ON growth_insights(created_at DESC);

-- 3. Growth Recommendations
CREATE TABLE IF NOT EXISTS growth_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES growth_insights(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'create_content', 'change_content_mix', 'target_persona', 'change_format',
    'review_platform', 'review_strategy', 'improve_conversion', 'follow_up_leads',
    'investigate_drop', 'test_new_topic', 'adjust_cadence', 'optimize_cadence'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  confidence REAL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'info')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'accepted', 'rejected', 'implemented', 'expired')),
  recommended_by TEXT DEFAULT 'ai',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  implementation_notes TEXT,
  brain_version INTEGER,
  strategy_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_recommendations_business ON growth_recommendations(business_id);
CREATE INDEX IF NOT EXISTS idx_growth_recommendations_insight ON growth_recommendations(insight_id);
CREATE INDEX IF NOT EXISTS idx_growth_recommendations_status ON growth_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_growth_recommendations_priority ON growth_recommendations(priority);

-- 4. Experiments
CREATE TABLE IF NOT EXISTS growth_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  variable TEXT NOT NULL,
  control_description TEXT NOT NULL,
  variant_description TEXT NOT NULL,
  metric TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'running', 'completed', 'cancelled')),
  result JSONB,
  conclusion TEXT,
  brain_version INTEGER,
  strategy_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_experiments_business ON growth_experiments(business_id);
CREATE INDEX IF NOT EXISTS idx_growth_experiments_status ON growth_experiments(status);

-- 5. Strategy Change Requests (for approval flow)
CREATE TABLE IF NOT EXISTS strategy_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES growth_recommendations(id) ON DELETE SET NULL,
  proposed_changes JSONB NOT NULL,
  rationale TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  requested_by TEXT DEFAULT 'ai',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  previous_strategy_version INTEGER,
  new_strategy_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_change_requests_business ON strategy_change_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_strategy_change_requests_status ON strategy_change_requests(status);

-- 6. Daily AI Briefs
CREATE TABLE IF NOT EXISTS daily_ai_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  brief_date DATE NOT NULL,
  what_happened TEXT,
  what_matters TEXT,
  next_move TEXT,
  needs_attention JSONB,
  impact_metrics JSONB,
  brain_version INTEGER,
  strategy_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, brief_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_briefs_business ON daily_ai_briefs(business_id);
CREATE INDEX IF NOT EXISTS idx_daily_briefs_date ON daily_ai_briefs(brief_date DESC);

-- 7. Weekly AI Reviews
CREATE TABLE IF NOT EXISTS weekly_ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  performance_summary TEXT,
  customer_insights TEXT,
  content_insights TEXT,
  lead_insights TEXT,
  strategy_assessment TEXT,
  next_week_plan TEXT,
  brain_version INTEGER,
  strategy_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reviews_business ON weekly_ai_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_week ON weekly_ai_reviews(week_start DESC);

-- 8. Content Attribution (link content -> post -> conversation -> lead)
CREATE TABLE IF NOT EXISTS content_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  social_post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES social_conversations(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES social_leads(id) ON DELETE SET NULL,
  attribution_type TEXT NOT NULL CHECK (attribution_type IN ('direct', 'influenced', 'assisted')),
  confidence REAL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_attributions_business ON content_attributions(business_id);
CREATE INDEX IF NOT EXISTS idx_content_attributions_content ON content_attributions(content_item_id);
CREATE INDEX IF NOT EXISTS idx_content_attributions_lead ON content_attributions(lead_id);

-- 9. Update triggers
CREATE OR REPLACE FUNCTION update_growth_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER growth_insights_updated_at
  BEFORE UPDATE ON growth_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_growth_insights_updated_at();

CREATE TRIGGER growth_recommendations_updated_at
  BEFORE UPDATE ON growth_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_growth_insights_updated_at();

CREATE TRIGGER growth_experiments_updated_at
  BEFORE UPDATE ON growth_experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_growth_insights_updated_at();

CREATE TRIGGER strategy_change_requests_updated_at
  BEFORE UPDATE ON strategy_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_growth_insights_updated_at();