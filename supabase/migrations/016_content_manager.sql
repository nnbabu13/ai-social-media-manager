-- Phase 14: AI Content Manager

-- 1. Content items
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'x')),
  type TEXT NOT NULL CHECK (type IN (
    'image_post', 'carousel', 'reel_script', 'text_post', 'educational',
    'testimonial', 'product_post', 'faq_post', 'promotional', 'community',
    'behind_the_scenes', 'customer_story'
  )),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  objective TEXT NOT NULL CHECK (objective IN (
    'education', 'awareness', 'engagement', 'trust', 'lead_generation',
    'sales', 'community', 'retention'
  )),
  pillar TEXT NOT NULL,
  persona_id TEXT,
  persona_name TEXT,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN (
    'idea', 'brief', 'draft', 'review', 'approved', 'rejected', 'archived'
  )),
  caption TEXT,
  creative_brief TEXT,
  script TEXT,
  hook TEXT,
  cta TEXT,
  hashtags TEXT[],
  source_observation_ids TEXT[] DEFAULT '{}',
  strategy_version INTEGER,
  brain_version INTEGER,
  strategy_override BOOLEAN DEFAULT false,
  quality_score REAL,
  quality_status TEXT CHECK (quality_status IN ('ready', 'needs_improvement', 'blocked')),
  validation_result JSONB DEFAULT '{}',
  review_result JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_items_business ON content_items(business_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_platform ON content_items(platform);
CREATE INDEX IF NOT EXISTS idx_content_items_pillar ON content_items(pillar);
CREATE INDEX IF NOT EXISTS idx_content_items_objective ON content_items(objective);

-- 2. Content versions
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  caption TEXT,
  creative_brief TEXT,
  script TEXT,
  hook TEXT,
  cta TEXT,
  changes_summary TEXT,
  created_by TEXT NOT NULL DEFAULT 'ai' CHECK (created_by IN ('ai', 'owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_versions_item ON content_versions(content_item_id);

-- 3. Content plans
CREATE TABLE IF NOT EXISTS content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  platform TEXT,
  items JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_plans_business ON content_plans(business_id);

-- 4. Update triggers
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER content_plans_updated_at
  BEFORE UPDATE ON content_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_content_updated_at();
