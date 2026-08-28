import { ContentClassificationSchema, InteractionClassificationSchema, ObservationSchema, RecommendationSchema, LeadSchema } from "@/types/social-intelligence";

describe("social intelligence schemas", () => {
  describe("ContentClassificationSchema", () => {
    it("validates a full classification", () => {
      const data = {
        pillar: "education",
        objective: "engagement",
        audience: "general",
        format: "image",
        product: "none",
        cta: "none",
        promotional: false,
        confidence: 0.8,
      };

      const result = ContentClassificationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pillar).toBe("education");
        expect(result.data.promotional).toBe(false);
      }
    });

    it("validates minimal classification", () => {
      const result = ContentClassificationSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("InteractionClassificationSchema", () => {
    it("validates a full classification", () => {
      const data = {
        classification: "purchase_intent",
        confidence: 0.9,
        reason: "Customer asking for pricing",
        priority: "high",
      };

      const result = InteractionClassificationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.classification).toBe("purchase_intent");
        expect(result.data.priority).toBe("high");
      }
    });

    it("rejects invalid classification", () => {
      const result = InteractionClassificationSchema.safeParse({
        classification: "invalid_type",
        confidence: 0.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ObservationSchema", () => {
    it("validates a full observation", () => {
      const data = {
        business_id: "550e8400-e29b-41d4-a716-446655440000",
        observation_type: "complaint",
        severity: "high",
        title: "Customer complaint",
        summary: "A customer is unhappy",
        evidence: { comment_text: "Terrible service" },
        source_ids: ["comment-123"],
        confidence: 0.85,
        status: "new",
        signature: "complaint::comment-123",
      };

      const result = ObservationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("validates minimal observation", () => {
      const result = ObservationSchema.safeParse({
        business_id: "550e8400-e29b-41d4-a716-446655440000",
        observation_type: "engagement_spike",
        title: "Spike detected",
        summary: "Engagement increased",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("RecommendationSchema", () => {
    it("validates a full recommendation", () => {
      const data = {
        business_id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Create educational content",
        description: "Your audience responds well to educational posts",
        action_type: "create_content",
        priority: "medium",
        confidence: 0.7,
        reason: "Educational content is underrepresented",
        status: "new",
      };

      const result = RecommendationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("LeadSchema", () => {
    it("validates a full lead", () => {
      const data = {
        business_id: "550e8400-e29b-41d4-a716-446655440000",
        social_account_id: "550e8400-e29b-41d4-a716-446655440001",
        platform_user_id: "user-123",
        name: "John Doe",
        source_type: "comment",
        intent: "high",
        reason: "Asking for pricing",
        status: "new",
        confidence: 0.8,
      };

      const result = LeadSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects lead without platform_user_id", () => {
      const result = LeadSchema.safeParse({
        business_id: "550e8400-e29b-41d4-a716-446655440000",
        social_account_id: "550e8400-e29b-41d4-a716-446655440001",
        source_type: "comment",
        intent: "high",
        reason: "Asking for pricing",
      });
      expect(result.success).toBe(false);
    });
  });
});
