-- Phase 2: Business Brain Tables
-- Extends Phase 1 with interview, knowledge, and business brain infrastructure

-- ============================================================
-- 1. Extend businesses table with optional website fields
-- ============================================================
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_scan_status TEXT DEFAULT 'not_scanned';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_scanned_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_knowledge JSONB DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS brain_completeness INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS brain_completed_at TIMESTAMPTZ;

-- ============================================================
-- 2. Extend brand_profiles with richer brand knowledge
-- ============================================================
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS brand_keywords TEXT[] DEFAULT '{}';
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS preferred_phrases TEXT[] DEFAULT '{}';
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS forbidden_phrases TEXT[] DEFAULT '{}';
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS emoji_preference TEXT DEFAULT 'moderate';
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS hashtag_preference TEXT DEFAULT 'moderate';
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS writing_length TEXT DEFAULT 'medium';
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS language_preferences TEXT[] DEFAULT '{en}';

-- ============================================================
-- 3. Extend business_products with pricing controls
-- ============================================================
ALTER TABLE business_products ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE business_products ADD COLUMN IF NOT EXISTS price_text TEXT;
ALTER TABLE business_products ADD COLUMN IF NOT EXISTS price_visibility TEXT DEFAULT 'ask_first';
ALTER TABLE business_products ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'in_stock';
ALTER TABLE business_products ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'owner';
ALTER TABLE business_products ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE business_products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================
-- 4. Create business_services
-- ============================================================
CREATE TABLE IF NOT EXISTS business_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_text TEXT,
  price_visibility TEXT DEFAULT 'ask_first',
  url TEXT,
  source_type TEXT DEFAULT 'owner',
  approval_status TEXT DEFAULT 'approved',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. Create business_facts
-- ============================================================
CREATE TABLE IF NOT EXISTS business_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  source_type TEXT DEFAULT 'owner',
  approval_status TEXT DEFAULT 'approved',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE business_facts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. Create business_faqs
-- ============================================================
CREATE TABLE IF NOT EXISTS business_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  priority INTEGER DEFAULT 0,
  source_type TEXT DEFAULT 'owner',
  approval_status TEXT DEFAULT 'approved',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE business_faqs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. Create business_locations
-- ============================================================
CREATE TABLE IF NOT EXISTS business_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  postal_code TEXT,
  phone TEXT,
  opening_hours JSONB DEFAULT '{}',
  service_area TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. Create business_offers
-- ============================================================
CREATE TABLE IF NOT EXISTS business_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  offer_type TEXT DEFAULT 'promotion',
  discount_text TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  terms TEXT,
  url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE business_offers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. Create customer_personas
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pain_points TEXT,
  needs TEXT,
  buying_triggers TEXT,
  objections TEXT,
  preferred_channels TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE customer_personas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. Create business_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS business_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL DEFAULT 'manual',
  source_type TEXT DEFAULT 'owner',
  content TEXT,
  source_url TEXT,
  approval_status TEXT DEFAULT 'approved',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE business_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. Create business_interviews
-- ============================================================
CREATE TABLE IF NOT EXISTS business_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  current_stage TEXT DEFAULT 'business',
  completion_percentage INTEGER DEFAULT 0,
  knowledge_extracted JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE business_interviews ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. Create business_interview_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS business_interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES business_interviews(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE business_interview_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13. Create knowledge_pending (for AI-extracted knowledge)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  data JSONB NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'ai_interview',
  confidence DECIMAL(3,2) DEFAULT 0.8,
  approval_status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE knowledge_pending ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_business_services_business ON business_services(business_id);
CREATE INDEX IF NOT EXISTS idx_business_facts_business ON business_facts(business_id);
CREATE INDEX IF NOT EXISTS idx_business_facts_category ON business_facts(business_id, category);
CREATE INDEX IF NOT EXISTS idx_business_faqs_business ON business_faqs(business_id);
CREATE INDEX IF NOT EXISTS idx_business_locations_business ON business_locations(business_id);
CREATE INDEX IF NOT EXISTS idx_business_offers_business ON business_offers(business_id);
CREATE INDEX IF NOT EXISTS idx_business_offers_active ON business_offers(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_customer_personas_business ON customer_personas(business_id);
CREATE INDEX IF NOT EXISTS idx_business_documents_business ON business_documents(business_id);
CREATE INDEX IF NOT EXISTS idx_business_interviews_business ON business_interviews(business_id);
CREATE INDEX IF NOT EXISTS idx_business_interview_messages_interview ON business_interview_messages(interview_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_pending_business ON knowledge_pending(business_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_pending_status ON knowledge_pending(business_id, approval_status);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_business_facts_fts ON business_facts USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_business_faqs_fts ON business_faqs USING gin(to_tsvector('english', question || ' ' || answer));
CREATE INDEX IF NOT EXISTS idx_business_services_fts ON business_services USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
