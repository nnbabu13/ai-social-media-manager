-- Phase 17: RLS policies for Leads extension

-- ========== social_leads (extend existing) ==========
-- Existing policies should work for new columns since they're on the same table

-- ========== lead_follow_ups ==========
ALTER TABLE lead_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_follow_ups_select" ON lead_follow_ups
FOR SELECT USING (
  lead_id IN (
    SELECT id FROM social_leads
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "lead_follow_ups_insert" ON lead_follow_ups
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "lead_follow_ups_update" ON lead_follow_ups
FOR UPDATE USING (
  lead_id IN (
    SELECT id FROM social_leads
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);

CREATE POLICY "lead_follow_ups_delete" ON lead_follow_ups
FOR DELETE USING (
  lead_id IN (
    SELECT id FROM social_leads
    WHERE business_id IN (SELECT get_user_business_ids())
  )
);