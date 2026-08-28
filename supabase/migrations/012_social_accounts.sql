-- Phase 12: Social Account Connections

-- 1. Social accounts (generic, supports facebook/instagram)
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  platform_account_id TEXT NOT NULL,
  account_name TEXT,
  username TEXT,
  account_type TEXT CHECK (account_type IN ('facebook_page', 'instagram_professional')),
  profile_url TEXT,
  profile_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'not_connected' CHECK (status IN (
    'not_connected', 'connecting', 'active', 'syncing', 'error', 'expired', 'disconnected'
  )),
  connection_status TEXT NOT NULL DEFAULT 'not_connected' CHECK (connection_status IN (
    'not_connected', 'connecting', 'connected', 'expired', 'disconnected', 'error'
  )),
  last_sync_started_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  last_successful_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform, platform_account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_business_id ON social_accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_status ON social_accounts(status);

-- 2. Social account credentials (server-only, encrypted)
CREATE TABLE IF NOT EXISTS social_account_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(social_account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_account_credentials_account ON social_account_credentials(social_account_id);

-- 3. Social account links (facebook page <-> instagram relationship)
CREATE TABLE IF NOT EXISTS social_account_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  parent_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  child_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('linked_to')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(parent_account_id, child_account_id),
  CHECK (parent_account_id != child_account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_account_links_business ON social_account_links(business_id);
CREATE INDEX IF NOT EXISTS idx_social_account_links_parent ON social_account_links(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_social_account_links_child ON social_account_links(child_account_id);

-- 4. OAuth states (single-use, time-limited)
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  state_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_user ON oauth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_hash ON oauth_states(state_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- 5. Social posts
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform_post_id TEXT NOT NULL,
  post_type TEXT,
  caption TEXT,
  permalink TEXT,
  published_at TIMESTAMPTZ,
  media_url TEXT,
  thumbnail_url TEXT,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(social_account_id, platform_post_id)
);

CREATE INDEX IF NOT EXISTS idx_social_posts_account ON social_posts(social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_published ON social_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform_id ON social_posts(platform_post_id);

-- 6. Social comments
CREATE TABLE IF NOT EXISTS social_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  social_post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  platform_comment_id TEXT NOT NULL,
  parent_platform_comment_id TEXT,
  author_platform_id TEXT,
  author_name TEXT,
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_data JSONB DEFAULT '{}',
  UNIQUE(social_account_id, platform_comment_id)
);

CREATE INDEX IF NOT EXISTS idx_social_comments_account ON social_comments(social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_post ON social_comments(social_post_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_platform_id ON social_comments(platform_comment_id);

-- 7. Social account metrics
CREATE TABLE IF NOT EXISTS social_account_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  followers_count INTEGER,
  following_count INTEGER,
  posts_count INTEGER,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(social_account_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_social_metrics_account ON social_account_metrics(social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_metrics_date ON social_account_metrics(metric_date);

-- 8. Social sync jobs
CREATE TABLE IF NOT EXISTS social_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('initial', 'manual', 'incremental', 'scheduled')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  progress JSONB DEFAULT '{}',
  items_found INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_business ON social_sync_jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_account ON social_sync_jobs(social_account_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON social_sync_jobs(status);

-- 9. Function to update social_accounts.updated_at
CREATE OR REPLACE FUNCTION update_social_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_accounts_updated_at();

CREATE TRIGGER social_account_credentials_updated_at
  BEFORE UPDATE ON social_account_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_social_accounts_updated_at();

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_accounts_updated_at();

CREATE TRIGGER social_comments_updated_at
  BEFORE UPDATE ON social_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_social_accounts_updated_at();
