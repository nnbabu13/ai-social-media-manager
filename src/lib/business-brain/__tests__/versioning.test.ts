import { buildSnapshot } from "@/lib/business-brain/versioning";
import type { BusinessBrainContext } from "@/types/business-brain";

function makeBrain(overrides: Partial<BusinessBrainContext> = {}): BusinessBrainContext {
  return {
    business: {
      id: "test-123",
      name: "Test Business",
      slug: "test-business",
      category: "Food & Beverage",
      description: "A test business",
      website_url: null,
      country: "India",
      region: "Andhra Pradesh",
      city: "Kakinada",
      target_customers: "Families",
    },
    products: [{ name: "Product A", description: "Test product", price: 10, price_visibility: "public" }],
    services: [],
    goals: [{ goal: "Get customers", is_primary: true }],
    brand: { tone: "Friendly", style_description: "Warm", avoid_words: null, tagline: null, brand_keywords: [], preferred_phrases: [], forbidden_phrases: [] },
    policies: null,
    facts: [{ category: "general", title: "Test fact", content: "Test content" }],
    faqs: [],
    locations: [],
    offers: [],
    personas: [],
    documents: [],
    business_persona: null,
    customer_personas: [],
    strategy: null,
    operations: null,
    brain_version: 1,
    ...overrides,
  };
}

describe("Brain Versioning", () => {
  describe("buildSnapshot", () => {
    it("creates a snapshot with all canonical Brain fields", () => {
      const brain = makeBrain();
      const snapshot = buildSnapshot(brain);

      expect(snapshot).toHaveProperty("business");
      expect(snapshot).toHaveProperty("products");
      expect(snapshot).toHaveProperty("services");
      expect(snapshot).toHaveProperty("goals");
      expect(snapshot).toHaveProperty("brand");
      expect(snapshot).toHaveProperty("policies");
      expect(snapshot).toHaveProperty("facts");
      expect(snapshot).toHaveProperty("faqs");
      expect(snapshot).toHaveProperty("locations");
      expect(snapshot).toHaveProperty("offers");
      expect(snapshot).toHaveProperty("customer_personas");
      expect(snapshot).toHaveProperty("business_persona");
      expect(snapshot).toHaveProperty("strategy");
      expect(snapshot).toHaveProperty("operations");
      expect(snapshot).toHaveProperty("readiness");
    });

    it("includes business identity in snapshot", () => {
      const brain = makeBrain();
      const snapshot = buildSnapshot(brain);

      expect(snapshot.business.name).toBe("Test Business");
      expect(snapshot.business.category).toBe("Food & Beverage");
    });

    it("includes products in snapshot", () => {
      const brain = makeBrain();
      const snapshot = buildSnapshot(brain);

      expect(snapshot.products).toHaveLength(1);
      expect(snapshot.products[0].name).toBe("Product A");
    });

    it("includes strategy in snapshot", () => {
      const brain = makeBrain({
        strategy: {
          primary_objective: { objective: "Get customers", description: "Generate leads" },
          content_pillars: [{ name: "Education", purpose: "education", recommended_percentage: 50 }],
          content_mix: [{ category: "education", percentage: 50 }],
          posting_cadence: { posts_per_week: 5 },
          conversion_strategy: { primary_action: "whatsapp", journey: [] },
          cta_strategy: [{ type: "soft", percentage: 100 }],
          platform_strategy: [{ platform: "instagram", priority: "primary" }],
        },
      });
      const snapshot = buildSnapshot(brain);

      expect(snapshot.strategy).not.toBeNull();
      expect(snapshot.strategy!.primary_objective.objective).toBe("Get customers");
    });

    it("includes readiness in snapshot", () => {
      const brain = makeBrain({
        readiness: {
          score: 85,
          status: "ready",
          domains: [],
          required_missing: [],
          optional_missing: [],
          future_domains: [],
        },
      });
      const snapshot = buildSnapshot(brain);

      expect(snapshot.readiness).not.toBeNull();
      expect(snapshot.readiness!.score).toBe(85);
    });

    it("handles null readiness", () => {
      const brain = makeBrain({ readiness: undefined });
      const snapshot = buildSnapshot(brain);

      expect(snapshot.readiness).toBeNull();
    });
  });
});
