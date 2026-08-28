-- Phase 13: RLS policies for social intelligence tables

-- ========== social_observations ==========
ALTER TABLE social_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_observations_select" ON social_observations
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "social_observations_insert" ON social_observations
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "social_observations_update" ON social_observations
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));

-- ========== social_recommendations ==========
ALTER TABLE social_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_recommendations_select" ON social_recommendations
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "social_recommendations_insert" ON social_recommendations
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "social_recommendations_update" ON social_recommendations
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));

-- ========== social_content_classifications ==========
ALTER TABLE social_content_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_content_classifications_select" ON social_content_classifications
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "social_content_classifications_insert" ON social_content_classifications
FOR INSERT TO authenticated WITH CHECK (true);

-- ========== social_leads ==========
ALTER TABLE social_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_leads_select" ON social_leads
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "social_leads_insert" ON social_leads
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "social_leads_update" ON social_leads
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));

-- ========== social_interactions ==========
ALTER TABLE social_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_interactions_select" ON social_interactions
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "social_interactions_insert" ON social_interactions
FOR INSERT TO authenticated WITH CHECK (true);

-- ========== social_scan_jobs ==========
ALTER TABLE social_scan_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_scan_jobs_select" ON social_scan_jobs
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "social_scan_jobs_insert" ON social_scan_jobs
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "social_scan_jobs_update" ON social_scan_jobs
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));
