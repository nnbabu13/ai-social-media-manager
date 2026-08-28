-- Phase 2: RLS Policies for Business Brain Tables
-- Uses the same helper functions from Phase 1 (get_user_business_ids, is_business_member)

-- ============================================================
-- business_services
-- ============================================================
ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view services for their businesses"
  ON business_services FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Authenticated users can insert services"
  ON business_services FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update services for their businesses"
  ON business_services FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete services for their businesses"
  ON business_services FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================================
-- business_facts
-- ============================================================
ALTER TABLE business_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view facts for their businesses"
  ON business_facts FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Authenticated users can insert facts"
  ON business_facts FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update facts for their businesses"
  ON business_facts FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete facts for their businesses"
  ON business_facts FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================================
-- business_faqs
-- ============================================================
ALTER TABLE business_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view FAQs for their businesses"
  ON business_faqs FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Authenticated users can insert FAQs"
  ON business_faqs FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update FAQs for their businesses"
  ON business_faqs FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete FAQs for their businesses"
  ON business_faqs FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================================
-- business_locations
-- ============================================================
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view locations for their businesses"
  ON business_locations FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Authenticated users can insert locations"
  ON business_locations FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update locations for their businesses"
  ON business_locations FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete locations for their businesses"
  ON business_locations FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================================
-- business_offers
-- ============================================================
ALTER TABLE business_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view offers for their businesses"
  ON business_offers FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Authenticated users can insert offers"
  ON business_offers FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update offers for their businesses"
  ON business_offers FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete offers for their businesses"
  ON business_offers FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================================
-- customer_personas
-- ============================================================
ALTER TABLE customer_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view personas for their businesses"
  ON customer_personas FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Authenticated users can insert personas"
  ON customer_personas FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update personas for their businesses"
  ON customer_personas FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete personas for their businesses"
  ON customer_personas FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================================
-- business_documents
-- ============================================================
ALTER TABLE business_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents for their businesses"
  ON business_documents FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Authenticated users can insert documents"
  ON business_documents FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update documents for their businesses"
  ON business_documents FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete documents for their businesses"
  ON business_documents FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================================
-- business_interviews
-- ============================================================
ALTER TABLE business_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interviews for their businesses"
  ON business_interviews FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Authenticated users can insert interviews"
  ON business_interviews FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update interviews for their businesses"
  ON business_interviews FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

-- ============================================================
-- business_interview_messages
-- ============================================================
ALTER TABLE business_interview_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their interviews"
  ON business_interview_messages FOR SELECT
  USING (
    interview_id IN (
      SELECT id FROM business_interviews
      WHERE business_id IN (SELECT get_user_business_ids())
    )
  );

CREATE POLICY "Authenticated users can insert messages"
  ON business_interview_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    interview_id IN (
      SELECT id FROM business_interviews
      WHERE business_id IN (SELECT get_user_business_ids())
    )
  );

-- ============================================================
-- knowledge_pending
-- ============================================================
ALTER TABLE knowledge_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pending knowledge for their businesses"
  ON knowledge_pending FOR SELECT
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Authenticated users can insert pending knowledge"
  ON knowledge_pending FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can update pending knowledge for their businesses"
  ON knowledge_pending FOR UPDATE
  USING (business_id IN (SELECT get_user_business_ids()));

CREATE POLICY "Users can delete pending knowledge for their businesses"
  ON knowledge_pending FOR DELETE
  USING (business_id IN (SELECT get_user_business_ids()));
