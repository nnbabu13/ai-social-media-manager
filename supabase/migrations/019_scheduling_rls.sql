-- Phase 15: RLS policies for scheduling/publishing tables

-- ========== content_schedules ==========
ALTER TABLE content_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_schedules_select" ON content_schedules
FOR SELECT USING (
  content_item_id IN (
    SELECT id FROM content_items
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "content_schedules_insert" ON content_schedules
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "content_schedules_update" ON content_schedules
FOR UPDATE USING (
  content_item_id IN (
    SELECT id FROM content_items
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "content_schedules_delete" ON content_schedules
FOR DELETE USING (
  content_item_id IN (
    SELECT id FROM content_items
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

-- ========== content_publish_jobs ==========
ALTER TABLE content_publish_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_publish_jobs_select" ON content_publish_jobs
FOR SELECT USING (
  content_item_id IN (
    SELECT id FROM content_items
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "content_publish_jobs_insert" ON content_publish_jobs
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "content_publish_jobs_update" ON content_publish_jobs
FOR UPDATE USING (
  content_item_id IN (
    SELECT id FROM content_items
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);
