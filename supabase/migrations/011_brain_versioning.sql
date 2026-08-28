-- Brain versioning: Track changes to the entire Business Brain
-- This allows us to know which Brain version was used for any AI action

CREATE TABLE IF NOT EXISTS brain_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, version_number)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_brain_versions_business_id ON brain_versions(business_id);
CREATE INDEX IF NOT EXISTS idx_brain_versions_business_version ON brain_versions(business_id, version_number DESC);

-- RLS policies
ALTER TABLE brain_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own brain versions"
  ON brain_versions FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own brain versions"
  ON brain_versions FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_members WHERE user_id = auth.uid()
  ));

-- Function to get current brain version
CREATE OR REPLACE FUNCTION get_current_brain_version(p_business_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) INTO current_version
  FROM brain_versions
  WHERE business_id = p_business_id;
  
  RETURN current_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment brain version
CREATE OR REPLACE FUNCTION increment_brain_version(
  p_business_id UUID,
  p_snapshot JSONB,
  p_change_summary TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  new_version INTEGER;
BEGIN
  -- Get current version
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO new_version
  FROM brain_versions
  WHERE business_id = p_business_id;
  
  -- Insert new version
  INSERT INTO brain_versions (business_id, version_number, snapshot, change_summary, created_by)
  VALUES (p_business_id, new_version, p_snapshot, p_change_summary, p_created_by);
  
  RETURN new_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;