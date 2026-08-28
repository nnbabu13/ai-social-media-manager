-- Enable Row Level Security on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create helper function to get user's business IDs
CREATE OR REPLACE FUNCTION get_user_business_ids()
RETURNS SETOF UUID AS $$
  SELECT business_id FROM business_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Create helper function to check if user is business member
CREATE OR REPLACE FUNCTION is_business_member(business_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members
    WHERE user_id = auth.uid() AND business_id = business_uuid
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Create helper function to check if user is business owner
CREATE OR REPLACE FUNCTION is_business_owner(business_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members
    WHERE user_id = auth.uid() AND business_id = business_uuid AND role = 'owner'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Businesses policies
CREATE POLICY "Users can view their own businesses"
  ON businesses FOR SELECT
  USING (id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can create businesses"
  ON businesses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own businesses"
  ON businesses FOR UPDATE
  USING (id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete their own businesses"
  ON businesses FOR DELETE
  USING (id IN (SELECT get_user_business_ids()));

-- Business members policies
CREATE POLICY "Users can view members of their businesses"
  ON business_members FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can add members to their businesses"
  ON business_members FOR INSERT
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update members of their businesses"
  ON business_members FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can remove members from their businesses"
  ON business_members FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));

-- Business products policies
CREATE POLICY "Users can view products of their businesses"
  ON business_products FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can create products in their businesses"
  ON business_products FOR INSERT
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update products in their businesses"
  ON business_products FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete products from their businesses"
  ON business_products FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));

-- Business goals policies
CREATE POLICY "Users can view goals of their businesses"
  ON business_goals FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can create goals in their businesses"
  ON business_goals FOR INSERT
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update goals in their businesses"
  ON business_goals FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete goals from their businesses"
  ON business_goals FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));

-- Brand profiles policies
CREATE POLICY "Users can view brand profiles of their businesses"
  ON brand_profiles FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can create brand profiles in their businesses"
  ON brand_profiles FOR INSERT
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update brand profiles in their businesses"
  ON brand_profiles FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete brand profiles from their businesses"
  ON brand_profiles FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));

-- AI policies policies
CREATE POLICY "Users can view AI policies of their businesses"
  ON ai_policies FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can create AI policies in their businesses"
  ON ai_policies FOR INSERT
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update AI policies in their businesses"
  ON ai_policies FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete AI policies from their businesses"
  ON ai_policies FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));

-- Audit logs policies
CREATE POLICY "Users can view audit logs of their businesses"
  ON audit_logs FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can create audit logs in their businesses"
  ON audit_logs FOR INSERT
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create notifications for their businesses"
  ON notifications FOR INSERT
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());
