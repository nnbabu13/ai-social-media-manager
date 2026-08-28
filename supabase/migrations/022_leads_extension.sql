-- Phase 17: AI Leads + Lightweight CRM + Customer Opportunity Management

-- Extend existing social_leads table
ALTER TABLE social_leads
  ADD COLUMN IF NOT EXISTS source_conversation_id UUID REFERENCES social_conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_message_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS observation_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interested_product_id UUID REFERENCES business_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS interested_service_id UUID REFERENCES business_services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requirement TEXT,
  ADD COLUMN IF NOT EXISTS quantity TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS estimated_value_currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stage TEXT CHECK (stage IN (
    'detected', 'qualified', 'quotation', 'negotiation', 'booked', 'won', 'lost'
  )),
  ADD COLUMN IF NOT EXISTS brain_version INTEGER,
  ADD COLUMN IF NOT EXISTS first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Update status enum to include new values
-- Note: We'll handle this by adding new CHECK constraint
ALTER TABLE social_leads DROP CONSTRAINT IF EXISTS social_leads_status_check;
ALTER TABLE social_leads ADD CONSTRAINT social_leads_status_check CHECK (
  status IN (
    'new', 'qualifying', 'qualified', 'contacted', 'follow_up',
    'won', 'lost', 'ignored', 'unqualified'
  )
);

-- Create lead follow-ups table
CREATE TABLE IF NOT EXISTS lead_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES social_leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('manual', 'ai_suggested', 'system')),
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'cancelled', 'overdue'
  )),
  message_draft TEXT,
  created_by UUID,
  completed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_lead ON lead_follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_status ON lead_follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_due ON lead_follow_ups(due_at);

-- Update triggers for new columns
CREATE OR REPLACE FUNCTION update_social_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS social_leads_updated_at ON social_leads;
CREATE TRIGGER social_leads_updated_at
  BEFORE UPDATE ON social_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_social_leads_updated_at();

CREATE OR REPLACE FUNCTION update_lead_follow_ups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_follow_ups_updated_at
  BEFORE UPDATE ON lead_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_follow_ups_updated_at();