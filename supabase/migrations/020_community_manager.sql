-- Phase 16: AI Community Manager — Conversations, Messages, Approvals, Jobs

-- 1. Conversations
CREATE TABLE IF NOT EXISTS social_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_conversation_id TEXT,
  channel_type TEXT NOT NULL DEFAULT 'comment_thread' CHECK (channel_type IN (
    'comment_thread', 'dm', 'review'
  )),
  customer_platform_id TEXT,
  customer_name TEXT,
  customer_username TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'new', 'open', 'needs_approval', 'escalated', 'waiting_customer',
    'waiting_business', 'resolved', 'archived'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
    'urgent', 'high', 'medium', 'low'
  )),
  intent TEXT,
  intent_confidence REAL,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN (
    'low', 'medium', 'high', 'critical'
  )),
  matched_persona_id UUID,
  persona_confidence REAL,
  summary TEXT,
  ai_handled BOOLEAN DEFAULT false,
  human_locked BOOLEAN DEFAULT false,
  ai_locked_until TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_inbound_at TIMESTAMPTZ,
  last_outbound_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_business ON social_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conv_account ON social_conversations(social_account_id);
CREATE INDEX IF NOT EXISTS idx_conv_status ON social_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conv_priority ON social_conversations(priority);
CREATE INDEX IF NOT EXISTS idx_conv_platform ON social_conversations(platform, platform_conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_last_message ON social_conversations(last_message_at DESC);

-- 2. Messages
CREATE TABLE IF NOT EXISTS social_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES social_conversations(id) ON DELETE CASCADE,
  platform_message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'business', 'ai', 'system')),
  sender_platform_id TEXT,
  sender_name TEXT,
  text TEXT,
  media_metadata JSONB,
  ai_classified BOOLEAN DEFAULT false,
  ai_intent TEXT,
  ai_confidence REAL,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msg_conversation ON social_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_msg_platform ON social_messages(platform_message_id);
CREATE INDEX IF NOT EXISTS idx_msg_direction ON social_messages(direction);
CREATE INDEX IF NOT EXISTS idx_msg_created ON social_messages(created_at DESC);

-- 3. Conversation Approvals
CREATE TABLE IF NOT EXISTS community_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES social_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES social_messages(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  draft_response TEXT NOT NULL,
  reason TEXT,
  risk_level TEXT DEFAULT 'low',
  confidence REAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'edited', 'expired'
  )),
  edited_response TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_conversation ON community_approvals(conversation_id);
CREATE INDEX IF NOT EXISTS idx_approval_status ON community_approvals(status);

-- 4. Community Action Jobs
CREATE TABLE IF NOT EXISTS community_action_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES social_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES social_messages(id) ON DELETE SET NULL,
  approval_id UUID REFERENCES community_approvals(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'processing', 'sent', 'failed', 'cancelled'
  )),
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  error_type TEXT,
  provider_message_id TEXT,
  idempotency_key TEXT,
  response_text TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_job_conversation ON community_action_jobs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_action_job_status ON community_action_jobs(status);
CREATE INDEX IF NOT EXISTS idx_action_job_idempotency ON community_action_jobs(idempotency_key);

-- 5. Conversation Notes (internal)
CREATE TABLE IF NOT EXISTS conversation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES social_conversations(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Triggers
CREATE OR REPLACE FUNCTION update_social_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_conversations_updated_at
  BEFORE UPDATE ON social_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_social_conversations_updated_at();

CREATE TRIGGER community_approvals_updated_at
  BEFORE UPDATE ON community_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_social_conversations_updated_at();

CREATE TRIGGER community_action_jobs_updated_at
  BEFORE UPDATE ON community_action_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_social_conversations_updated_at();
