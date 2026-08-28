-- Social Strategy tables for Phase 2E
-- Stores the AI Social Media Strategy

CREATE TABLE IF NOT EXISTS social_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  primary_objective JSONB NOT NULL DEFAULT '{}',
  secondary_objectives JSONB NOT NULL DEFAULT '[]',
  
  target_personas JSONB NOT NULL DEFAULT '[]',
  
  content_mix JSONB NOT NULL DEFAULT '[]',
  preferred_formats JSONB NOT NULL DEFAULT '[]',
  posting_cadence JSONB NOT NULL DEFAULT '{}',
  
  platform_strategy JSONB NOT NULL DEFAULT '[]',
  conversion_strategy JSONB NOT NULL DEFAULT '{}',
  cta_strategy JSONB NOT NULL DEFAULT '[]',
  
  seasonal_strategy JSONB DEFAULT '[]',
  content_rules JSONB NOT NULL DEFAULT '{}',
  
  strategy_status TEXT NOT NULL DEFAULT 'review' CHECK (strategy_status IN ('draft', 'review', 'approved', 'active')),
  source_type TEXT NOT NULL DEFAULT 'ai_derived' CHECK (source_type IN ('owner_confirmed', 'ai_derived')),
  
  explanation TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(business_id)
);

CREATE TABLE IF NOT EXISTS content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES social_strategies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('education', 'awareness', 'engagement', 'trust', 'lead_generation', 'sales', 'community', 'retention')),
  
  target_personas JSONB NOT NULL DEFAULT '[]',
  priority TEXT NOT NULL DEFAULT 'secondary' CHECK (priority IN ('primary', 'secondary')),
  recommended_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  example_topics JSONB NOT NULL DEFAULT '[]',
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  source_type TEXT NOT NULL DEFAULT 'ai_derived' CHECK (source_type IN ('owner_confirmed', 'ai_derived')),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('approved', 'pending')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS strategy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES social_strategies(id) ON DELETE CASCADE,
  
  version_number INTEGER NOT NULL,
  strategy_snapshot JSONB NOT NULL,
  changed_fields JSONB NOT NULL DEFAULT '[]',
  
  reason TEXT,
  user_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_strategies_business_id ON social_strategies(business_id);
CREATE INDEX IF NOT EXISTS idx_content_pillars_business_id ON content_pillars(business_id);
CREATE INDEX IF NOT EXISTS idx_content_pillars_strategy_id ON content_pillars(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_versions_business_id ON strategy_versions(business_id);

-- RLS policies
ALTER TABLE social_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own social strategies"
  ON social_strategies FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own social strategies"
  ON social_strategies FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own social strategies"
  ON social_strategies FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own social strategies"
  ON social_strategies FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own content pillars"
  ON content_pillars FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own content pillars"
  ON content_pillars FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own content pillars"
  ON content_pillars FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own content pillars"
  ON content_pillars FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own strategy versions"
  ON strategy_versions FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own strategy versions"
  ON strategy_versions FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
