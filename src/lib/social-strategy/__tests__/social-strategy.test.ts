import { generateSocialStrategy, validateContentMixPercentages } from "@/lib/social-strategy";
import type { BusinessBrainContext } from "@/types/business-brain";

function createMockBrain(overrides: Partial<BusinessBrainContext> = {}): BusinessBrainContext {
  return {
    business: {
      id: "test-1",
      name: "Test Business",
      slug: "test-business",
      category: "restaurant",
      description: "A test restaurant with more than twenty characters",
      city: "New York",
      region: "NY",
      country: "US",
      website_url: "https://test.com",
      phone: "555-0100",
      email: "test@test.com",
      target_customers: "Families and professionals",
      differentiators: "Quality ingredients",
      customer_journey: "Social media to visit",
      desired_actions: "Book a table",
      business_hours: "Mon-Fri 9-5",
      special_info: "Parking available",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides?.business,
    },
    products: overrides?.products || [{ name: "Pizza", description: "Wood-fired pizza", price: 15, price_visibility: "public" }],
    services: overrides?.services || [{ name: "Dine-in", description: "Full service dining", price_text: null }],
    goals: overrides?.goals || [{ goal: "Increase bookings", is_primary: true }],
    brand: overrides?.brand || { tone: "friendly", style_description: "Warm and welcoming", avoid_words: "cheap", tagline: "Taste the difference", brand_keywords: ["food"], preferred_phrases: ["Welcome"], forbidden_phrases: ["hate"] },
    policies: overrides?.policies || null,
    facts: overrides?.facts || [],
    faqs: overrides?.faqs || [],
    locations: overrides?.locations || [],
    offers: overrides?.offers || [],
    personas: overrides?.personas || [],
    documents: overrides?.documents || [],
    business_persona: overrides?.business_persona || null,
    customer_personas: overrides?.customer_personas || [],
    strategy: overrides?.strategy || null,
    readiness: overrides?.readiness || undefined,
  };
}

describe("Social Strategy", () => {
  describe("generateSocialStrategy", () => {
    it("generates a strategy from brain data", () => {
      const brain = createMockBrain();
      const { strategy, pillars } = generateSocialStrategy(brain);

      expect(strategy).toBeDefined();
      expect(strategy.primary_objective).toBeDefined();
      expect(strategy.content_mix.length).toBeGreaterThan(0);
      expect(strategy.posting_cadence).toBeDefined();
      expect(strategy.conversion_strategy).toBeDefined();
      expect(strategy.cta_strategy.length).toBeGreaterThan(0);
      expect(pillars.length).toBeGreaterThan(0);
    });

    it("derives primary objective from goals", () => {
      const brain = createMockBrain({
        goals: [{ goal: "Generate leads", is_primary: true }],
      });
      const { strategy } = generateSocialStrategy(brain);

      expect(strategy.primary_objective.objective).toContain("lead");
    });

    it("derives booking objective from goals", () => {
      const brain = createMockBrain({
        goals: [{ goal: "Get bookings", is_primary: true }],
      });
      const { strategy } = generateSocialStrategy(brain);

      expect(strategy.primary_objective.objective).toContain("booking");
    });

    it("creates content pillars for restaurant", () => {
      const brain = createMockBrain({
        business: { category: "restaurant" },
      });
      const { pillars } = generateSocialStrategy(brain);

      expect(pillars.some(p => p.name.toLowerCase().includes("food") || p.name.toLowerCase().includes("menu"))).toBe(true);
    });

    it("creates content pillars for salon", () => {
      const brain = createMockBrain({
        business: { category: "salon" },
      });
      const { pillars } = generateSocialStrategy(brain);

      expect(pillars.some(p => p.name.toLowerCase().includes("transformation"))).toBe(true);
    });

    it("content mix totals 100%", () => {
      const brain = createMockBrain();
      const { strategy } = generateSocialStrategy(brain);

      const total = strategy.content_mix.reduce((sum, item) => sum + item.percentage, 0);
      expect(total).toBe(100);
    });

    it("posting cadence is reasonable", () => {
      const brain = createMockBrain();
      const { strategy } = generateSocialStrategy(brain);

      expect(strategy.posting_cadence.posts_per_week).toBeGreaterThanOrEqual(2);
      expect(strategy.posting_cadence.posts_per_week).toBeLessThanOrEqual(7);
    });

    it("includes conversion journey", () => {
      const brain = createMockBrain();
      const { strategy } = generateSocialStrategy(brain);

      expect(strategy.conversion_strategy.journey.length).toBeGreaterThan(0);
    });

    it("cta strategy percentages total 100%", () => {
      const brain = createMockBrain();
      const { strategy } = generateSocialStrategy(brain);

      const total = strategy.cta_strategy.reduce((sum, item) => sum + item.percentage, 0);
      expect(total).toBe(100);
    });

    it("sets strategy status to review", () => {
      const brain = createMockBrain();
      const { strategy } = generateSocialStrategy(brain);

      expect(strategy.strategy_status).toBe("review");
    });

    it("sets source type as ai_derived", () => {
      const brain = createMockBrain();
      const { strategy } = generateSocialStrategy(brain);

      expect(strategy.source_type).toBe("ai_derived");
    });

    it("includes explanation", () => {
      const brain = createMockBrain();
      const { strategy } = generateSocialStrategy(brain);

      expect(strategy.explanation).toBeTruthy();
    });

    it("targets customer personas when available", () => {
      const brain = createMockBrain({
        customer_personas: [
          { id: "1", name: "Families", description: "Family diners", segments: ["Families"], needs: [], pain_points: [], buying_triggers: [], objections: [], decision_factors: [], desired_outcomes: [], content_interests: [], preferred_channels: [], conversion_action: "Book", priority: "primary", confidence: 0.8, source_type: "ai_derived" },
        ],
      });
      const { strategy } = generateSocialStrategy(brain);

      expect(strategy.target_personas.length).toBeGreaterThan(0);
    });
  });

  describe("validateContentMixPercentages", () => {
    it("validates correct percentages", () => {
      const mix = [
        { category: "Educational", percentage: 40, description: "test" },
        { category: "Product", percentage: 30, description: "test" },
        { category: "Social Proof", percentage: 20, description: "test" },
        { category: "Promotional", percentage: 10, description: "test" },
      ];

      const result = validateContentMixPercentages(mix);
      expect(result.valid).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it("detects incorrect percentages", () => {
      const mix = [
        { category: "Educational", percentage: 40, description: "test" },
        { category: "Product", percentage: 30, description: "test" },
        { category: "Social Proof", percentage: 20, description: "test" },
      ];

      const result = validateContentMixPercentages(mix);
      expect(result.valid).toBe(false);
      expect(result.remaining).toBe(10);
    });

    it("handles empty mix", () => {
      const result = validateContentMixPercentages([]);
      expect(result.valid).toBe(false);
      expect(result.remaining).toBe(100);
    });
  });
});
