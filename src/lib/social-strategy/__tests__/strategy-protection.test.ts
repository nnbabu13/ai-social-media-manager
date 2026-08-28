import { generateSocialStrategy } from "@/lib/social-strategy";
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

describe("Strategy Protection", () => {
  describe("generateSocialStrategy", () => {
    it("generates a strategy with draft status for new businesses", () => {
      const brain = createMockBrain();
      const { strategy } = generateSocialStrategy(brain);

      expect(strategy.strategy_status).toBe("review");
      expect(strategy.source_type).toBe("ai_derived");
    });

    it("generates strategy with correct content mix totaling 100%", () => {
      const brain = createMockBrain();
      const { strategy } = generateSocialStrategy(brain);

      const total = strategy.content_mix.reduce((sum, item) => sum + item.percentage, 0);
      expect(total).toBe(100);
    });

    it("includes target personas from brain", () => {
      const brain = createMockBrain({
        customer_personas: [
          {
            id: "1",
            name: "Families",
            description: "Family diners",
            segments: ["Families"],
            needs: [],
            pain_points: [],
            buying_triggers: [],
            objections: [],
            decision_factors: [],
            desired_outcomes: [],
            content_interests: [],
            preferred_channels: [],
            conversion_action: "Book",
            priority: "primary",
            confidence: 0.8,
            source_type: "ai_derived",
          },
        ],
      });
      const { strategy } = generateSocialStrategy(brain);

      expect(strategy.target_personas).toHaveLength(1);
      expect(strategy.target_personas[0].name).toBe("Families");
    });

    it("derives conversion strategy from brain goals", () => {
      const brain = createMockBrain({
        goals: [{ goal: "Generate leads", is_primary: true }],
      });
      const { strategy } = generateSocialStrategy(brain);

      expect(strategy.conversion_strategy).toBeDefined();
      expect(strategy.conversion_strategy.primary_action).toBeDefined();
    });
  });
});
