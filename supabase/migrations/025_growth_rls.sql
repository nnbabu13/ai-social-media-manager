-- Phase 18: RLS policies for Growth Strategist tables

-- ========== content_performance_snapshots ==========
ALTER TABLE content_performance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_performance_snapshots_select" ON content_performance_snapshots
FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids())
);

CREATE POLICY "content_performance_snapshots_insert" ON content_performance_snapshots
FOR INSERT TO authenticated WITH CHECK (true);

-- ========== growth_insights ==========
ALTER TABLE growth_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "growth_insights_select" ON growth_insights
FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids())
);

CREATE POLICY "growth_insights_insert" ON growth_insights
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "growth_insights_update" ON growth_insights
FOR UPDATE USING (
  business_id IN (SELECT get_user_business_ids())
);

-- ========== growth_recommendations ==========
ALTER TABLE growth_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "growth_recommendations_select" ON growth_recommendations
FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids())
);

CREATE POLICY "growth_recommendations_insert" ON growth_recommendations
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "growth_recommendations_update" ON growth_recommendations
FOR UPDATE USING (
  business_id IN (SELECT get_user_business_ids())
);

-- ========== growth_experiments ==========
ALTER TABLE growth_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "growth_experiments_select" ON growth_experiments
FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids())
);

CREATE POLICY "growth_experiments_insert" ON growth_experiments
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "growth_experiments_update" ON growth_experiments
FOR UPDATE USING (
  business_id IN (SELECT get_user_business_ids())
);

-- ========== strategy_change_requests ==========
ALTER TABLE strategy_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "strategy_change_requests_select" ON strategy_change_requests
FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids())
);

CREATE POLICY "strategy_change_requests_insert" ON strategy_change_requests
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "strategy_change_requests_update" ON strategy_change_requests
FOR UPDATE USING (
  business_id IN (SELECT get_user_business_ids())
);

-- ========== daily_ai_briefs ==========
ALTER TABLE daily_ai_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_ai_briefs_select" ON daily_ai_briefs
FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids())
);

CREATE POLICY "daily_ai_briefs_insert" ON daily_ai_briefs
FOR INSERT TO authenticated WITH CHECK (true);

-- ========== weekly_ai_reviews ==========
ALTER TABLE weekly_ai_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_ai_reviews_select" ON weekly_ai_reviews
FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids())
);

CREATE POLICY "weekly_ai_reviews_insert" ON weekly_ai_reviews
FOR INSERT TO authenticated WITH CHECK (true);

-- ========== content_attributions ==========
ALTER TABLE content_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_attributions_select" ON content_attributions
FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids())
);

CREATE POLICY "content_attributions_insert" ON content_attributions
FOR INSERT TO authenticated WITH CHECK (true);