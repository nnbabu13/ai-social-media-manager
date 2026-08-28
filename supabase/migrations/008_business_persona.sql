-- Business Persona table for Phase 2D
-- Stores the canonical Business Persona derived from confirmed Business Brain information

CREATE TABLE IF NOT EXISTS business_persona (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  personality_traits JSONB NOT NULL DEFAULT '[]',
  tone JSONB NOT NULL DEFAULT '[]',
  communication_style TEXT NOT NULL DEFAULT '',
  
  brand_values JSONB NOT NULL DEFAULT '[]',
  positioning TEXT NOT NULL DEFAULT '',
  differentiators JSONB NOT NULL DEFAULT '[]',
  
  preferred_languages JSONB NOT NULL DEFAULT '["English"]',
  preferred_phrases JSONB NOT NULL DEFAULT '[]',
  forbidden_phrases JSONB NOT NULL DEFAULT '[]',
  
  emoji_preference TEXT NOT NULL DEFAULT 'minimal' CHECK (emoji_preference IN ('none', 'minimal', 'moderate', 'frequent')),
  formality TEXT NOT NULL DEFAULT 'balanced' CHECK (formality IN ('casual', 'balanced', 'professional')),
  
  content_personality JSONB NOT NULL DEFAULT '[]',
  customer_facing_behavior TEXT NOT NULL DEFAULT '',
  
  brand_promises JSONB NOT NULL DEFAULT '[]',
  approved_claims JSONB NOT NULL DEFAULT '[]',
  restricted_claims JSONB NOT NULL DEFAULT '[]',
  
  source_type TEXT NOT NULL DEFAULT 'ai_derived' CHECK (source_type IN ('owner_confirmed', 'ai_derived')),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('approved', 'pending')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(business_id)
);

-- Add decision_factors and desired_outcomes to customer_personas
ALTER TABLE customer_personas 
  ADD COLUMN IF NOT EXISTS decision_factors JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS desired_outcomes JSONB DEFAULT '[]';

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_business_persona_business_id ON business_persona(business_id);

-- RLS policies
ALTER TABLE business_persona ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business persona"
  ON business_persona FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own business persona"
  ON business_persona FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own business persona"
  ON business_persona FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM business_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own business persona"
  ON business_persona FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM business_members WHERE user_id = auth.uid()
    )
  );
