-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- ============================================
-- BUSINESSES
-- ============================================
CREATE POLICY "businesses_select" ON businesses
FOR SELECT USING (id IN (SELECT get_user_business_ids()));

CREATE POLICY "businesses_insert" ON businesses
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "businesses_update" ON businesses
FOR UPDATE USING (id IN (SELECT get_user_business_ids()));

CREATE POLICY "businesses_delete" ON businesses
FOR DELETE USING (id IN (SELECT get_user_business_ids()));

-- ============================================
-- BUSINESS MEMBERS
-- ============================================
CREATE POLICY "business_members_select" ON business_members
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "business_members_insert" ON business_members
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "business_members_update" ON business_members
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "business_members_delete" ON business_members
FOR DELETE USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================
-- BUSINESS PRODUCTS
-- ============================================
CREATE POLICY "business_products_select" ON business_products
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "business_products_insert" ON business_products
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "business_products_update" ON business_products
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "business_products_delete" ON business_products
FOR DELETE USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================
-- BUSINESS GOALS
-- ============================================
CREATE POLICY "business_goals_select" ON business_goals
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "business_goals_insert" ON business_goals
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "business_goals_update" ON business_goals
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "business_goals_delete" ON business_goals
FOR DELETE USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================
-- BRAND PROFILES
-- ============================================
CREATE POLICY "brand_profiles_select" ON brand_profiles
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "brand_profiles_insert" ON brand_profiles
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "brand_profiles_update" ON brand_profiles
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "brand_profiles_delete" ON brand_profiles
FOR DELETE USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================
-- AI POLICIES
-- ============================================
CREATE POLICY "ai_policies_select" ON ai_policies
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "ai_policies_insert" ON ai_policies
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "ai_policies_update" ON ai_policies
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "ai_policies_delete" ON ai_policies
FOR DELETE USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE POLICY "audit_logs_select" ON audit_logs
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "audit_logs_insert" ON audit_logs
FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE POLICY "notifications_select" ON notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON notifications
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_update" ON notifications
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_delete" ON notifications
FOR DELETE USING (user_id = auth.uid());
