import { reviewCommunityResponse } from "../response-generator";

describe("Community Response Generator", () => {
  describe("reviewCommunityResponse", () => {
    it("rejects empty response", () => {
      const result = reviewCommunityResponse("", {}, {
        businessBrain: {},
        conversation: {},
        messages: [],
        classification: {
          intent: "general_question",
          confidence: 0.6,
          priority: "medium",
          riskLevel: "low",
          reason: "Test",
        },
        platform: "instagram",
      });
      expect(result.valid).toBe(false);
      expect(result.issues).toContain("Response is empty");
    });

    it("passes valid response", () => {
      const result = reviewCommunityResponse("Thank you for your question!", {}, {
        businessBrain: {},
        conversation: {},
        messages: [],
        classification: {
          intent: "general_question",
          confidence: 0.6,
          priority: "medium",
          riskLevel: "low",
          reason: "Test",
        },
        platform: "instagram",
      });
      expect(result.valid).toBe(true);
    });

    it("detects unsupported claims", () => {
      const result = reviewCommunityResponse("We are government certified.", {}, {
        businessBrain: {},
        conversation: {},
        messages: [],
        classification: {
          intent: "general_question",
          confidence: 0.6,
          priority: "medium",
          riskLevel: "low",
          reason: "Test",
        },
        platform: "instagram",
      });
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.includes("unsupported claims"))).toBe(true);
    });
  });
});
