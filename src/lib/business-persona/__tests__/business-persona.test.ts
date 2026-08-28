import { generateBusinessPersonaFromBrain, identifyMissingPersonaAttributes } from "@/lib/business-persona";
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
    products: overrides?.products || [{ id: "1", name: "Pizza", description: "Wood-fired pizza", price: 15, is_active: true, price_visibility: "public" }],
    services: overrides?.services || [{ id: "1", name: "Dine-in", description: "Full service dining", price_text: null, is_active: true, approval_status: "approved" }],
    goals: overrides?.goals || [{ id: "1", goal: "Increase bookings", priority: "high", is_primary: true }],
    brand: overrides?.brand || { tone: "friendly", style_description: "Warm and welcoming", avoid_words: "cheap", tagline: "Taste the difference", brand_keywords: ["food", "restaurant"], preferred_phrases: ["Welcome"], forbidden_phrases: ["hate"], emoji_preference: "minimal", hashtag_preference: "#food", writing_length: "short", language_preferences: ["English"] },
    policies: overrides?.policies || null,
    facts: overrides?.facts || [],
    faqs: overrides?.faqs || [],
    locations: overrides?.locations || [],
    offers: overrides?.offers || [],
    personas: overrides?.personas || [
      { name: "Families", description: "Family diners", pain_points: "Long waits", needs: "Quick service" },
    ],
    documents: overrides?.documents || [],
    readiness: overrides?.readiness || undefined,
  };
}

describe("Business Persona", () => {
  describe("generateBusinessPersonaFromBrain", () => {
    it("generates a persona from brain data", () => {
      const brain = createMockBrain();
      const persona = generateBusinessPersonaFromBrain(brain);

      expect(persona).toBeDefined();
      expect(persona.personality_traits.length).toBeGreaterThan(0);
      expect(persona.tone.length).toBeGreaterThan(0);
      expect(persona.communication_style).toBeTruthy();
      expect(persona.brand_values.length).toBeGreaterThan(0);
      expect(persona.positioning).toBeTruthy();
      expect(persona.content_personality.length).toBeGreaterThan(0);
    });

    it("uses brand tone from brain", () => {
      const brain = createMockBrain({
        brand: { tone: "professional", style_description: null, avoid_words: null, tagline: null, brand_keywords: [], preferred_phrases: [], forbidden_phrases: [], emoji_preference: "minimal", hashtag_preference: "", writing_length: "short", language_preferences: [] },
      });
      const persona = generateBusinessPersonaFromBrain(brain);

      expect(persona.tone).toContain("professional");
    });

    it("derives formality from tone", () => {
      const brain = createMockBrain({
        brand: { tone: "professional", style_description: null, avoid_words: null, tagline: null, brand_keywords: [], preferred_phrases: [], forbidden_phrases: [], emoji_preference: "minimal", hashtag_preference: "", writing_length: "short", language_preferences: [] },
      });
      const persona = generateBusinessPersonaFromBrain(brain);

      expect(persona.formality).toBe("professional");
    });

    it("derives emoji preference from tone", () => {
      const brain = createMockBrain({
        brand: { tone: "fun", style_description: null, avoid_words: null, tagline: null, brand_keywords: [], preferred_phrases: [], forbidden_phrases: [], emoji_preference: "minimal", hashtag_preference: "", writing_length: "short", language_preferences: [] },
      });
      const persona = generateBusinessPersonaFromBrain(brain);

      expect(persona.emoji_preference).toBe("frequent");
    });

    it("includes differentiators from facts", () => {
      const brain = createMockBrain({
        facts: [
          { category: "differentiators", title: "Our edge", content: "Fresh ingredients" },
        ],
      });
      const persona = generateBusinessPersonaFromBrain(brain);

      expect(persona.differentiators).toContain("Fresh ingredients");
    });

    it("includes approved claims for products", () => {
      const brain = createMockBrain({
        products: [{ id: "1", name: "Pizza", description: "Wood-fired pizza", price: 15, is_active: true, price_visibility: "public" }],
      });
      const persona = generateBusinessPersonaFromBrain(brain);

      expect(persona.approved_claims.some(c => c.includes("product"))).toBe(true);
    });

    it("includes restricted claims", () => {
      const brain = createMockBrain();
      const persona = generateBusinessPersonaFromBrain(brain);

      expect(persona.restricted_claims.length).toBeGreaterThan(0);
      expect(persona.restricted_claims.some(c => c.includes("competitor"))).toBe(true);
    });

    it("sets source_type as ai_derived", () => {
      const brain = createMockBrain();
      const persona = generateBusinessPersonaFromBrain(brain);

      expect(persona.source_type).toBe("ai_derived");
    });

    it("sets approval_status as pending", () => {
      const brain = createMockBrain();
      const persona = generateBusinessPersonaFromBrain(brain);

      expect(persona.approval_status).toBe("pending");
    });
  });

  describe("identifyMissingPersonaAttributes", () => {
    it("identifies missing attributes", () => {
      const persona = {
        personality_traits: [],
        tone: [],
        communication_style: "",
        brand_values: [],
        positioning: "",
        differentiators: [],
        content_personality: [],
        customer_facing_behavior: "",
        approved_claims: [],
        restricted_claims: [],
      };

      const missing = identifyMissingPersonaAttributes(persona as any);
      expect(missing.length).toBeGreaterThan(0);
    });

    it("returns empty when all attributes present", () => {
      const persona = {
        personality_traits: ["Friendly"],
        tone: ["Professional"],
        communication_style: "Clear and concise",
        brand_values: ["Quality"],
        positioning: "A quality business",
        differentiators: ["Expert service"],
        content_personality: ["Informative"],
        customer_facing_behavior: "Professional and helpful",
        approved_claims: ["We offer services"],
        restricted_claims: ["No competitor claims"],
      };

      const missing = identifyMissingPersonaAttributes(persona as any);
      expect(missing.length).toBe(0);
    });
  });
});
