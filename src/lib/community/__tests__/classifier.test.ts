import { classifyConversation, shouldAutoReply, getActionType } from "../classifier";

describe("Community Manager Classifier", () => {
  describe("classifyConversation", () => {
    it("detects pricing questions", () => {
      const result = classifyConversation("How much is the 500ml bottle?");
      expect(result.intent).toBe("pricing_question");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("detects delivery questions", () => {
      const result = classifyConversation("Do you deliver to Vizag?");
      expect(result.intent).toBe("delivery_question");
    });

    it("detects complaints", () => {
      const result = classifyConversation("Very disappointed. Nobody responded.");
      expect(result.intent).toBe("complaint");
      expect(result.riskLevel).toBe("high");
    });

    it("detects purchase intent", () => {
      const result = classifyConversation("I want 500 bottles for our wedding.");
      expect(result.intent).toBe("purchase_intent");
      expect(result.priority).toBe("high");
    });

    it("detects positive feedback", () => {
      const result = classifyConversation("Love your product!");
      expect(result.intent).toBe("positive_feedback");
      expect(result.riskLevel).toBe("low");
    });

    it("detects spam", () => {
      const result = classifyConversation("Free money! Click here now!");
      expect(result.intent).toBe("spam");
    });

    it("detects partnership inquiries", () => {
      const result = classifyConversation("Can we collaborate on a project?");
      expect(result.intent).toBe("partnership");
    });

    it("detects general questions", () => {
      const result = classifyConversation("What are your hours?");
      expect(result.intent).toBe("general_question");
    });
  });

  describe("shouldAutoReply", () => {
    it("allows auto-reply for low-risk questions", () => {
      const classification = classifyConversation("Where are you located?");
      expect(shouldAutoReply(classification)).toBe(true);
    });

    it("blocks auto-reply for complaints", () => {
      const classification = classifyConversation("This is terrible service.");
      expect(shouldAutoReply(classification)).toBe(false);
    });

    it("blocks auto-reply for high-risk", () => {
      const classification = classifyConversation("I want a refund for my order.");
      expect(shouldAutoReply(classification)).toBe(false);
    });
  });

  describe("getActionType", () => {
    it("returns correct action for pricing", () => {
      expect(getActionType("pricing_question")).toBe("answer_pricing");
    });

    it("returns correct action for complaint", () => {
      expect(getActionType("complaint")).toBe("handle_complaint");
    });

    it("returns correct action for positive feedback", () => {
      expect(getActionType("positive_feedback")).toBe("reply_to_comment");
    });
  });
});
