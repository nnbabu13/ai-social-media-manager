import {
  getDefaultRiskLevel,
  getDefaultMode,
  resolveAIActionPolicy,
  detectRuleConflicts,
} from "@/lib/ai-operating-rules/policy-resolver";
import type {
  AIOperatingRule,
  CustomAIRule,
  AIEscalationRule,
  AutonomyConfig,
} from "@/types/ai-operating-rules";

describe("AI Operating Rules Policy Resolver", () => {
  describe("getDefaultRiskLevel", () => {
    it("returns correct risk levels for different actions", () => {
      expect(getDefaultRiskLevel("create_content")).toBe("medium");
      expect(getDefaultRiskLevel("publish_content")).toBe("high");
      expect(getDefaultRiskLevel("read_comments")).toBe("low");
      expect(getDefaultRiskLevel("handle_refund")).toBe("critical");
      expect(getDefaultRiskLevel("offer_discount")).toBe("critical");
    });
  });

  describe("getDefaultMode", () => {
    it("returns correct default modes for different actions", () => {
      expect(getDefaultMode("create_content")).toBe("approval");
      expect(getDefaultMode("read_comments")).toBe("auto");
      expect(getDefaultMode("handle_complaint")).toBe("human_only");
      expect(getDefaultMode("handle_refund")).toBe("human_only");
      expect(getDefaultMode("offer_discount")).toBe("human_only");
    });
  });

  describe("resolveAIActionPolicy", () => {
    const baseInput = {
      business_id: "test-business-id",
      operatingRules: [],
      customRules: [],
      escalationRules: [],
      autonomyConfig: null,
    };

    it("returns critical mode for handle_refund", () => {
      const result = resolveAIActionPolicy({
        ...baseInput,
        action_type: "handle_refund",
      });

      expect(result.mode).toBe("human_only");
      expect(result.risk_level).toBe("critical");
      expect(result.requiredEscalation).toBe(true);
      expect(result.source).toBe("critical_safety");
    });

    it("returns critical mode for offer_discount", () => {
      const result = resolveAIActionPolicy({
        ...baseInput,
        action_type: "offer_discount",
      });

      expect(result.mode).toBe("human_only");
      expect(result.risk_level).toBe("critical");
    });

    it("returns critical mode for negotiate_price", () => {
      const result = resolveAIActionPolicy({
        ...baseInput,
        action_type: "negotiate_price",
      });

      expect(result.mode).toBe("human_only");
      expect(result.risk_level).toBe("critical");
    });

    it("returns default mode when no rules apply", () => {
      const result = resolveAIActionPolicy({
        ...baseInput,
        action_type: "read_comments",
      });

      expect(result.mode).toBe("auto");
      expect(result.risk_level).toBe("low");
      expect(result.source).toBe("system_default");
    });

    it("uses operating rule when available", () => {
      const operatingRule: AIOperatingRule = {
        id: "test-id",
        business_id: "test-business-id",
        action_type: "create_content",
        mode: "auto",
        risk_level: "medium",
        enabled: true,
        source_type: "owner_confirmed",
      };

      const result = resolveAIActionPolicy({
        ...baseInput,
        action_type: "create_content",
        operatingRules: [operatingRule],
      });

      expect(result.mode).toBe("auto");
      expect(result.source).toBe("operating_rule");
    });

    it("uses custom rule when available", () => {
      const customRule: CustomAIRule = {
        id: "test-id",
        business_id: "test-business-id",
        name: "Custom content rule",
        description: "Test rule",
        trigger: "content creation",
        action: "create_content",
        priority: 1,
        mode: "approval",
        enabled: true,
        source_type: "owner_confirmed",
      };

      const result = resolveAIActionPolicy({
        ...baseInput,
        action_type: "create_content",
        customRules: [customRule],
      });

      expect(result.mode).toBe("approval");
      expect(result.source).toBe("custom_rule");
    });

    it("escalates on low confidence", () => {
      const escalationRule: AIEscalationRule = {
        id: "test-id",
        business_id: "test-business-id",
        trigger_type: "confidence",
        condition: "0.8",
        action: "require_approval",
        priority: "high",
        enabled: true,
      };

      const result = resolveAIActionPolicy({
        ...baseInput,
        action_type: "reply_to_comment",
        escalationRules: [escalationRule],
        context: { confidence: 0.7 },
      });

      expect(result.requiredEscalation).toBe(true);
      expect(result.source).toBe("escalation");
    });

    it("downgrades auto to approval when confidence below threshold", () => {
      const autonomyConfig: AutonomyConfig = {
        id: "test-id",
        business_id: "test-business-id",
        profile: "assistant",
        minimum_confidence_for_auto: 0.9,
      };

      const result = resolveAIActionPolicy({
        ...baseInput,
        action_type: "read_comments",
        autonomyConfig,
        context: { confidence: 0.85 },
      });

      expect(result.mode).toBe("approval");
      expect(result.source).toBe("confidence_threshold");
    });
  });

  describe("detectRuleConflicts", () => {
    it("returns empty array when no conflicts", () => {
      const rules: AIOperatingRule[] = [
        {
          id: "1",
          business_id: "test",
          action_type: "create_content",
          mode: "auto",
          risk_level: "medium",
          enabled: true,
          source_type: "owner_confirmed",
        },
      ];

      const conflicts = detectRuleConflicts(rules);
      expect(conflicts).toHaveLength(0);
    });

    it("detects conflicting modes", () => {
      const rules: AIOperatingRule[] = [
        {
          id: "1",
          business_id: "test",
          action_type: "create_content",
          mode: "auto",
          risk_level: "medium",
          enabled: true,
          source_type: "owner_confirmed",
        },
        {
          id: "2",
          business_id: "test",
          action_type: "create_content",
          mode: "approval",
          risk_level: "medium",
          enabled: true,
          source_type: "owner_confirmed",
        },
      ];

      const conflicts = detectRuleConflicts(rules);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].action).toBe("create_content");
    });
  });
});
