-- Phase 12: RLS policies for social account tables

-- Helper: check if user owns the social account via business membership
CREATE OR REPLACE FUNCTION is_social_account_owner(account_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM social_accounts sa
    WHERE sa.id = account_uuid
    AND sa.business_id IN (SELECT get_user_business_ids())
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========== social_accounts ==========
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_accounts_select" ON social_accounts
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "social_accounts_insert" ON social_accounts
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "social_accounts_update" ON social_accounts
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "social_accounts_delete" ON social_accounts
FOR DELETE USING (business_id IN (SELECT get_user_business_ids()));

-- ========== social_account_credentials ==========
ALTER TABLE social_account_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_account_credentials_select" ON social_account_credentials
FOR SELECT USING (
  social_account_id IN (
    SELECT id FROM social_accounts
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "social_account_credentials_insert" ON social_account_credentials
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "social_account_credentials_update" ON social_account_credentials
FOR UPDATE USING (
  social_account_id IN (
    SELECT id FROM social_accounts
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "social_account_credentials_delete" ON social_account_credentials
FOR DELETE USING (
  social_account_id IN (
    SELECT id FROM social_accounts
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

-- ========== social_account_links ==========
ALTER TABLE social_account_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_account_links_select" ON social_account_links
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "social_account_links_insert" ON social_account_links
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "social_account_links_delete" ON social_account_links
FOR DELETE USING (business_id IN (SELECT get_user_business_ids()));

-- ========== oauth_states ==========
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oauth_states_select" ON oauth_states
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "oauth_states_insert" ON oauth_states
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "oauth_states_update" ON oauth_states
FOR UPDATE USING (user_id = auth.uid());

-- ========== social_posts ==========
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_posts_select" ON social_posts
FOR SELECT USING (
  social_account_id IN (
    SELECT id FROM social_accounts
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "social_posts_insert" ON social_posts
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "social_posts_update" ON social_posts
FOR UPDATE USING (
  social_account_id IN (
    SELECT id FROM social_accounts
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "social_posts_delete" ON social_posts
FOR DELETE USING (
  social_account_id IN (
    SELECT id FROM social_accounts
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

-- ========== social_comments ==========
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_comments_select" ON social_comments
FOR SELECT USING (
  social_account_id IN (
    SELECT id FROM social_accounts
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "social_comments_insert" ON social_comments
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "social_comments_update" ON social_comments
FOR UPDATE USING (
  social_account_id IN (
    SELECT id FROM social_accounts
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "social_comments_delete" ON social_comments
FOR DELETE USING (
  social_account_id IN (
    SELECT id FROM social_accounts
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

-- ========== social_account_metrics ==========
ALTER TABLE social_account_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_account_metrics_select" ON social_account_metrics
FOR SELECT USING (
  social_account_id IN (
    SELECT id FROM social_accounts
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "social_account_metrics_insert" ON social_account_metrics
FOR INSERT TO authenticated WITH CHECK (true);

-- ========== social_sync_jobs ==========
ALTER TABLE social_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_sync_jobs_select" ON social_sync_jobs
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "social_sync_jobs_insert" ON social_sync_jobs
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "social_sync_jobs_update" ON social_sync_jobs
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));
