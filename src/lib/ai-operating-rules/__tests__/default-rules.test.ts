import { getDefaultMode, getDefaultRiskLevel } from "@/lib/ai-operating-rules/policy-resolver";
import { AI_ACTION_TYPES, type AIActionType } from "@/types/ai-operating-rules";

describe("Default Operating Rules", () => {
  describe("getDefaultMode", () => {
    it("returns auto for safe internal operations", () => {
      expect(getDefaultMode("read_comments")).toBe("auto");
      expect(getDefaultMode("read_dm")).toBe("auto");
      expect(getDefaultMode("draft_dm_reply")).toBe("auto");
      expect(getDefaultMode("detect_lead")).toBe("auto");
      expect(getDefaultMode("create_lead")).toBe("auto");
      expect(getDefaultMode("qualify_lead")).toBe("auto");
      expect(getDefaultMode("answer_faq")).toBe("auto");
      expect(getDefaultMode("answer_availability")).toBe("auto");
    });

    it("returns approval for content creation and customer interactions", () => {
      expect(getDefaultMode("create_content")).toBe("approval");
      expect(getDefaultMode("edit_content")).toBe("approval");
      expect(getDefaultMode("schedule_content")).toBe("approval");
      expect(getDefaultMode("publish_content")).toBe("approval");
      expect(getDefaultMode("reply_to_comment")).toBe("approval");
      expect(getDefaultMode("send_dm_reply")).toBe("approval");
      expect(getDefaultMode("answer_pricing")).toBe("approval");
      expect(getDefaultMode("answer_delivery")).toBe("approval");
      expect(getDefaultMode("answer_booking")).toBe("approval");
      expect(getDefaultMode("send_lead_followup")).toBe("approval");
    });

    it("returns human_only for sensitive actions", () => {
      expect(getDefaultMode("handle_complaint")).toBe("human_only");
      expect(getDefaultMode("handle_refund")).toBe("human_only");
      expect(getDefaultMode("offer_discount")).toBe("human_only");
      expect(getDefaultMode("negotiate_price")).toBe("human_only");
      expect(getDefaultMode("handle_partnership")).toBe("human_only");
      expect(getDefaultMode("handle_collaboration")).toBe("human_only");
      expect(getDefaultMode("respond_to_media_request")).toBe("human_only");
    });

    it("covers all action types", () => {
      for (const actionType of AI_ACTION_TYPES) {
        const mode = getDefaultMode(actionType);
        expect(["auto", "approval", "human_only"]).toContain(mode);
      }
    });
  });

  describe("getDefaultRiskLevel", () => {
    it("returns low for safe operations", () => {
      expect(getDefaultRiskLevel("read_comments")).toBe("low");
      expect(getDefaultRiskLevel("read_dm")).toBe("low");
      expect(getDefaultRiskLevel("draft_dm_reply")).toBe("low");
      expect(getDefaultRiskLevel("detect_lead")).toBe("low");
      expect(getDefaultRiskLevel("create_lead")).toBe("low");
      expect(getDefaultRiskLevel("qualify_lead")).toBe("low");
      expect(getDefaultRiskLevel("answer_faq")).toBe("low");
      expect(getDefaultRiskLevel("answer_availability")).toBe("low");
    });

    it("returns medium for content operations", () => {
      expect(getDefaultRiskLevel("create_content")).toBe("medium");
      expect(getDefaultRiskLevel("edit_content")).toBe("medium");
      expect(getDefaultRiskLevel("schedule_content")).toBe("medium");
      expect(getDefaultRiskLevel("reply_to_comment")).toBe("medium");
      expect(getDefaultRiskLevel("send_lead_followup")).toBe("medium");
    });

    it("returns high for sensitive operations", () => {
      expect(getDefaultRiskLevel("publish_content")).toBe("high");
      expect(getDefaultRiskLevel("send_dm_reply")).toBe("high");
      expect(getDefaultRiskLevel("answer_pricing")).toBe("high");
      expect(getDefaultRiskLevel("handle_complaint")).toBe("high");
      expect(getDefaultRiskLevel("handle_cancellation")).toBe("high");
    });

    it("returns critical for most sensitive operations", () => {
      expect(getDefaultRiskLevel("handle_refund")).toBe("critical");
      expect(getDefaultRiskLevel("offer_discount")).toBe("critical");
      expect(getDefaultRiskLevel("negotiate_price")).toBe("critical");
      expect(getDefaultRiskLevel("handle_partnership")).toBe("critical");
    });

    it("covers all action types", () => {
      for (const actionType of AI_ACTION_TYPES) {
        const riskLevel = getDefaultRiskLevel(actionType);
        expect(["low", "medium", "high", "critical"]).toContain(riskLevel);
      }
    });
  });

  describe("Action taxonomy completeness", () => {
    it("includes all required action types", () => {
      const requiredActions: AIActionType[] = [
        "create_content",
        "edit_content",
        "schedule_content",
        "publish_content",
        "read_comments",
        "reply_to_comment",
        "hide_comment",
        "delete_comment",
        "read_dm",
        "draft_dm_reply",
        "send_dm_reply",
        "read_review",
        "draft_review_reply",
        "send_review_reply",
        "detect_lead",
        "create_lead",
        "qualify_lead",
        "send_lead_followup",
        "answer_faq",
        "answer_pricing",
        "answer_delivery",
        "answer_availability",
        "answer_booking",
        "handle_complaint",
        "handle_refund",
        "handle_cancellation",
        "mention_offer",
        "create_promotion",
        "offer_discount",
        "negotiate_price",
        "handle_partnership",
        "handle_collaboration",
        "respond_to_media_request",
      ];

      for (const action of requiredActions) {
        expect(AI_ACTION_TYPES).toContain(action);
      }
    });
  });
});
