import { canTransition, getValidTransitions, transitionContent } from "../state-machine";

describe("Content State Machine", () => {
  describe("canTransition", () => {
    it("allows draft to review", () => {
      expect(canTransition("draft", "review")).toBe(true);
    });

    it("allows review to approved", () => {
      expect(canTransition("review", "approved")).toBe(true);
    });

    it("allows approved to scheduled", () => {
      expect(canTransition("approved", "scheduled")).toBe(true);
    });

    it("allows scheduled to publishing", () => {
      expect(canTransition("scheduled", "publishing")).toBe(true);
    });

    it("allows publishing to published", () => {
      expect(canTransition("publishing", "published")).toBe(true);
    });

    it("allows publishing to failed", () => {
      expect(canTransition("publishing", "failed")).toBe(true);
    });

    it("allows failed to scheduled for retry", () => {
      expect(canTransition("failed", "scheduled")).toBe(true);
    });

    it("allows approved to cancelled", () => {
      expect(canTransition("approved", "cancelled")).toBe(true);
    });

    it("allows scheduled to cancelled", () => {
      expect(canTransition("scheduled", "cancelled")).toBe(true);
    });

    it("does not allow published to scheduled", () => {
      expect(canTransition("published", "scheduled")).toBe(false);
    });

    it("does not allow idea to scheduled", () => {
      expect(canTransition("idea", "scheduled")).toBe(false);
    });

    it("does not allow draft to published directly", () => {
      expect(canTransition("draft", "published")).toBe(false);
    });
  });

  describe("getValidTransitions", () => {
    it("returns valid transitions for draft", () => {
      const transitions = getValidTransitions("draft");
      expect(transitions).toContain("review");
      expect(transitions).toContain("archived");
    });

    it("returns valid transitions for approved", () => {
      const transitions = getValidTransitions("approved");
      expect(transitions).toContain("scheduled");
      expect(transitions).toContain("cancelled");
    });

    it("returns empty for archived", () => {
      const transitions = getValidTransitions("archived");
      expect(transitions).toHaveLength(0);
    });
  });

  describe("transitionContent", () => {
    it("returns valid for allowed transition", () => {
      const result = transitionContent("draft", "review");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("returns invalid with error for disallowed transition", () => {
      const result = transitionContent("draft", "published");
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("Cannot transition");
    });
  });
});
