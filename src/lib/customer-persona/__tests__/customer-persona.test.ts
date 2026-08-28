import { generateCustomerPersonasFromBrain, identifyMissingPersonaFields } from "@/lib/customer-persona";
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
    products: overrides?.products || [],
    services: overrides?.services || [],
    goals: overrides?.goals || [{ id: "1", goal: "Increase bookings", priority: "high", is_primary: true }],
    brand: overrides?.brand || null,
    policies: overrides?.policies || null,
    facts: overrides?.facts || [],
    faqs: overrides?.faqs || [],
    locations: overrides?.locations || [],
    offers: overrides?.offers || [],
    personas: overrides?.personas || [],
    documents: overrides?.documents || [],
    readiness: overrides?.readiness || undefined,
  };
}

describe("Customer Persona", () => {
  describe("generateCustomerPersonasFromBrain", () => {
    it("generates personas from target customers", () => {
      const brain = createMockBrain();
      const personas = generateCustomerPersonasFromBrain(brain);

      expect(personas.length).toBeGreaterThan(0);
      expect(personas[0].name).toBeTruthy();
      expect(personas[0].description).toBeTruthy();
    });

    it("creates separate personas for multiple segments", () => {
      const brain = createMockBrain({
        business: { target_customers: "Families, Event organizers, Businesses" },
      });
      const personas = generateCustomerPersonasFromBrain(brain);

      expect(personas.length).toBe(3);
    });

    it("creates one persona for single segment", () => {
      const brain = createMockBrain({
        business: { target_customers: "Families" },
      });
      const personas = generateCustomerPersonasFromBrain(brain);

      expect(personas.length).toBe(1);
      expect(personas[0].priority).toBe("primary");
    });

    it("assigns primary priority to first segment", () => {
      const brain = createMockBrain({
        business: { target_customers: "Families, Event organizers" },
      });
      const personas = generateCustomerPersonasFromBrain(brain);

      expect(personas[0].priority).toBe("primary");
      expect(personas[1].priority).toBe("secondary");
    });

    it("derives conversion action from goals", () => {
      const brain = createMockBrain({
        goals: [{ id: "1", goal: "Book a table", priority: "high", is_primary: true }],
      });
      const personas = generateCustomerPersonasFromBrain(brain);

      expect(personas[0].conversion_action).toBe("Book a table");
    });

    it("derives conversion action from services when no goals", () => {
      const brain = createMockBrain({
        goals: [],
        services: [{ id: "1", name: "Dine-in", description: null, price_text: null, is_active: true, approval_status: "approved" }],
      });
      const personas = generateCustomerPersonasFromBrain(brain);

      expect(personas[0].conversion_action).toBe("Book a service");
    });

    it("uses default conversion action when no goals or services", () => {
      const brain = createMockBrain({
        goals: [],
        services: [],
      });
      const personas = generateCustomerPersonasFromBrain(brain);

      expect(personas[0].conversion_action).toBe("Contact the business");
    });

    it("returns empty when no target customers or personas", () => {
      const brain = createMockBrain({
        business: { target_customers: null },
        personas: [],
      });
      const personas = generateCustomerPersonasFromBrain(brain);

      expect(personas.length).toBe(0);
    });

    it("sets source_type as ai_derived", () => {
      const brain = createMockBrain();
      const personas = generateCustomerPersonasFromBrain(brain);

      expect(personas[0].source_type).toBe("ai_derived");
    });

    it("sets approval_status as pending", () => {
      const brain = createMockBrain();
      const personas = generateCustomerPersonasFromBrain(brain);

      expect(personas[0].approval_status).toBe("pending");
    });

    it("generates personas for each segment", () => {
      const brain = createMockBrain({
        business: { target_customers: "Families, Local Families" },
      });
      const personas = generateCustomerPersonasFromBrain(brain);

      expect(personas.length).toBe(2);
    });
  });

  describe("identifyMissingPersonaFields", () => {
    it("identifies missing fields", () => {
      const persona = {
        name: "Test",
        description: "",
        segments: ["Test"],
        needs: [],
        pain_points: [],
        buying_triggers: [],
        objections: [],
        decision_factors: [],
        desired_outcomes: [],
        content_interests: [],
        preferred_channels: [],
        conversion_action: "",
        priority: "secondary" as const,
        confidence: 0.7,
        source_type: "ai_derived" as const,
        approval_status: "pending" as const,
      };

      const missing = identifyMissingPersonaFields(persona);
      expect(missing).toContain("description");
      expect(missing).toContain("needs");
      expect(missing).toContain("pain_points");
      expect(missing).toContain("conversion_action");
    });

    it("returns empty when all fields present", () => {
      const persona = {
        name: "Test",
        description: "Test persona",
        segments: ["Test"],
        needs: ["Quality"],
        pain_points: ["Long waits"],
        buying_triggers: ["Price"],
        objections: [],
        decision_factors: [],
        desired_outcomes: [],
        content_interests: ["Tips"],
        preferred_channels: [],
        conversion_action: "Book",
        priority: "primary" as const,
        confidence: 0.8,
        source_type: "owner_confirmed" as const,
        approval_status: "approved" as const,
      };

      const missing = identifyMissingPersonaFields(persona);
      expect(missing.length).toBe(0);
    });
  });
});
