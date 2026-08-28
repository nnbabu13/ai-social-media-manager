-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  website_url TEXT,
  description TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  target_customers TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);

-- Create business_members table
CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_business_members_user_id ON business_members(user_id);

-- Create index on business_id
CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON business_members(business_id);

-- Create business_products table
CREATE TABLE IF NOT EXISTS business_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on business_id
CREATE INDEX IF NOT EXISTS idx_business_products_business_id ON business_products(business_id);

-- Create business_goals table
CREATE TABLE IF NOT EXISTS business_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on business_id
CREATE INDEX IF NOT EXISTS idx_business_goals_business_id ON business_goals(business_id);

-- Create brand_profiles table
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  tone TEXT NOT NULL,
  style_description TEXT,
  avoid_words TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on business_id
CREATE INDEX IF NOT EXISTS idx_brand_profiles_business_id ON brand_profiles(business_id);

-- Create ai_policies table
CREATE TABLE IF NOT EXISTS ai_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  autonomy_level TEXT NOT NULL DEFAULT 'assistant' CHECK (autonomy_level IN ('assistant', 'manager')),
  require_approval_discount BOOLEAN NOT NULL DEFAULT TRUE,
  require_approval_refund BOOLEAN NOT NULL DEFAULT TRUE,
  require_approval_complaint BOOLEAN NOT NULL DEFAULT TRUE,
  require_approval_pricing BOOLEAN NOT NULL DEFAULT TRUE,
  require_approval_legal BOOLEAN NOT NULL DEFAULT TRUE,
  require_approval_medical BOOLEAN NOT NULL DEFAULT TRUE,
  require_approval_partnership BOOLEAN NOT NULL DEFAULT TRUE,
  require_approval_promises BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on business_id
CREATE INDEX IF NOT EXISTS idx_ai_policies_business_id ON ai_policies(business_id);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on business_id
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON audit_logs(business_id);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Create index on action
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on business_id
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Create index on read
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
