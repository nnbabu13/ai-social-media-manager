-- Phase 16: RLS policies for Community Manager tables

-- ========== social_conversations ==========
ALTER TABLE social_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_conversations_select" ON social_conversations
FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids())
);

CREATE POLICY "social_conversations_insert" ON social_conversations
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "social_conversations_update" ON social_conversations
FOR UPDATE USING (
  business_id IN (SELECT get_user_business_ids())
);

-- ========== social_messages ==========
ALTER TABLE social_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_messages_select" ON social_messages
FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM social_conversations
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "social_messages_insert" ON social_messages
FOR INSERT TO authenticated WITH CHECK (true);

-- ========== community_approvals ==========
ALTER TABLE community_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_approvals_select" ON community_approvals
FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM social_conversations
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "community_approvals_insert" ON community_approvals
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "community_approvals_update" ON community_approvals
FOR UPDATE USING (
  conversation_id IN (
    SELECT id FROM social_conversations
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

-- ========== community_action_jobs ==========
ALTER TABLE community_action_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_action_jobs_select" ON community_action_jobs
FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM social_conversations
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "community_action_jobs_insert" ON community_action_jobs
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "community_action_jobs_update" ON community_action_jobs
FOR UPDATE USING (
  conversation_id IN (
    SELECT id FROM social_conversations
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

-- ========== conversation_notes ==========
ALTER TABLE conversation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation_notes_select" ON conversation_notes
FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM social_conversations
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "conversation_notes_insert" ON conversation_notes
FOR INSERT TO authenticated WITH CHECK (true);
