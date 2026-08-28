import { ContentBriefSchema, ContentIdeaSchema, ContentDraftSchema, ContentReviewSchema, ClaimValidationSchema } from "@/types/content";

describe("content manager schemas", () => {
  describe("ContentIdeaSchema", () => {
    it("validates a full idea", () => {
      const result = ContentIdeaSchema.safeParse({
        title: "3 mistakes to avoid",
        pillar: "Education",
        personaName: "Event Organizers",
        objective: "education",
        format: "carousel",
        rationale: "Builds trust with the audience",
        topic: "Common mistakes",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ContentBriefSchema", () => {
    it("validates a full brief", () => {
      const result = ContentBriefSchema.safeParse({
        objective: "lead_generation",
        pillar: "Education",
        topic: "Custom bottle options",
        keyMessage: "Custom bottles create professional presentation",
        format: "reel_script",
        cta: "Message us on WhatsApp",
        supportingFacts: ["We offer custom bottles"],
        restrictions: [],
        platform: "instagram",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ContentDraftSchema", () => {
    it("validates a full draft", () => {
      const result = ContentDraftSchema.safeParse({
        hook: "Did you know?",
        caption: "Custom bottles can transform your event.",
        cta: "Message us",
        hashtags: ["custom", "events"],
      });
      expect(result.success).toBe(true);
    });

    it("validates minimal draft", () => {
      const result = ContentDraftSchema.safeParse({
        hook: "Check this out",
        caption: "Great product",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ContentReviewSchema", () => {
    it("validates a full review", () => {
      const result = ContentReviewSchema.safeParse({
        approved: true,
        score: 0.85,
        status: "ready",
        issues: [],
        warnings: [],
        suggestions: ["Add more hashtags"],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ClaimValidationSchema", () => {
    it("validates a full validation", () => {
      const result = ClaimValidationSchema.safeParse({
        valid: true,
        unsupportedClaims: [],
        warnings: [],
      });
      expect(result.success).toBe(true);
    });

    it("validates with unsupported claims", () => {
      const result = ClaimValidationSchema.safeParse({
        valid: false,
        unsupportedClaims: ["Price claim not supported"],
        warnings: ["Check testimonial"],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        expect(result.data.unsupportedClaims).toHaveLength(1);
      }
    });
  });
});
