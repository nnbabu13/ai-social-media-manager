-- AI Operating Rules tables for Phase 2F
-- Stores the AI's operational permissions and autonomy configuration

CREATE TABLE IF NOT EXISTS ai_operating_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  action_type TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('auto', 'approval', 'human_only', 'disabled')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  enabled BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB DEFAULT '[]',
  escalation_reason TEXT,
  
  source_type TEXT NOT NULL DEFAULT 'system_default' CHECK (source_type IN ('owner_confirmed', 'ai_derived', 'system_default')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(business_id, action_type)
);

CREATE TABLE IF NOT EXISTS custom_ai_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  trigger_condition TEXT NOT NULL,
  action TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 50 CHECK (priority >= 1 AND priority <= 100),
  mode TEXT NOT NULL CHECK (mode IN ('auto', 'approval', 'human_only', 'disabled')),
  
  enabled BOOLEAN NOT NULL DEFAULT true,
  source_type TEXT NOT NULL DEFAULT 'owner_confirmed' CHECK (source_type IN ('owner_confirmed', 'ai_derived')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'intent', 'sentiment', 'risk', 'topic', 'confidence', 'policy')),
  condition TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('notify_owner', 'require_approval', 'block_action')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS autonomy_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  profile TEXT NOT NULL DEFAULT 'assistant' CHECK (profile IN ('assistant', 'manager', 'autopilot')),
  minimum_confidence_for_auto NUMERIC(3,2) NOT NULL DEFAULT 0.90,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(business_id)
);

CREATE TABLE IF NOT EXISTS ai_action_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  action_type TEXT,
  mode TEXT,
  risk_level TEXT,
  reason TEXT,
  context JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_operating_rules_business_id ON ai_operating_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_custom_ai_rules_business_id ON custom_ai_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_escalation_rules_business_id ON ai_escalation_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_configs_business_id ON autonomy_configs(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_audit_log_business_id ON ai_action_audit_log(business_id);

-- RLS policies
ALTER TABLE ai_operating_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_ai_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI operating rules"
  ON ai_operating_rules FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own AI operating rules"
  ON ai_operating_rules FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own AI operating rules"
  ON ai_operating_rules FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own AI operating rules"
  ON ai_operating_rules FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own custom AI rules"
  ON custom_ai_rules FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own custom AI rules"
  ON custom_ai_rules FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own custom AI rules"
  ON custom_ai_rules FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own custom AI rules"
  ON custom_ai_rules FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own AI escalation rules"
  ON ai_escalation_rules FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own AI escalation rules"
  ON ai_escalation_rules FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own AI escalation rules"
  ON ai_escalation_rules FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own AI escalation rules"
  ON ai_escalation_rules FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own autonomy configs"
  ON autonomy_configs FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own autonomy configs"
  ON autonomy_configs FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own autonomy configs"
  ON autonomy_configs FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own AI action audit logs"
  ON ai_action_audit_log FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own AI action audit logs"
  ON ai_action_audit_log FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
