-- Phase 14: RLS policies for content manager tables

-- ========== content_items ==========
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_items_select" ON content_items
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "content_items_insert" ON content_items
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "content_items_update" ON content_items
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "content_items_delete" ON content_items
FOR DELETE USING (business_id IN (SELECT get_user_business_ids()));

-- ========== content_versions ==========
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_versions_select" ON content_versions
FOR SELECT USING (
  content_item_id IN (
    SELECT id FROM content_items
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "content_versions_insert" ON content_versions
FOR INSERT TO authenticated WITH CHECK (true);

-- ========== content_plans ==========
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_plans_select" ON content_plans
FOR SELECT USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "content_plans_insert" ON content_plans
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "content_plans_update" ON content_plans
FOR UPDATE USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "content_plans_delete" ON content_plans
FOR DELETE USING (business_id IN (SELECT get_user_business_ids()));
