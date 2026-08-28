import { generateSmartProfilingScreens, getNextMissingDomain, getProfilingProgress } from "@/lib/business-profiling/smart-profiler";
import type { BusinessBrainContext } from "@/types/business-brain";

function createMockBrain(overrides: Partial<BusinessBrainContext> = {}): BusinessBrainContext {
  return {
    business: {
      id: "test-1",
      name: "Test Business",
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
    products: overrides?.products || [{ id: "1", name: "Pizza", description: "Wood-fired pizza", price: 15, is_active: true }],
    services: overrides?.services || [{ id: "1", name: "Dine-in", description: "Full service dining", price: null, is_active: true }],
    goals: overrides?.goals || [{ id: "1", goal: "Increase bookings", priority: "high" }],
    brand: overrides?.brand || { tone: "friendly" },
    personas: overrides?.personas || [
      { name: "Families", description: "Family diners", pain_points: "Long waits", needs: "Quick service" },
    ],
    faqs: overrides?.faqs || [],
    facts: overrides?.facts || [
      { id: "1", category: "conversion", content: "Book a table" },
      { id: "2", category: "customer_needs", content: "Quick service" },
      { id: "3", category: "customer_questions", content: "Hours and reservations" },
      { id: "4", category: "customer_journey", content: "Social media discovery" },
      { id: "5", category: "content_strategy", content: "Food photos" },
      { id: "6", category: "positioning", content: "Quality ingredients" },
      { id: "7", category: "policies", content: "Reservations required" },
      { id: "8", category: "ai_rules", content: "Assistant mode" },
    ],
    locations: overrides?.locations || [],
    offers: overrides?.offers || [],
    readiness: overrides?.readiness || undefined,
  };
}

describe("Smart Profiler", () => {
  describe("generateSmartProfilingScreens", () => {
    it("generates screens for empty business", () => {
      const brain = createMockBrain({ business: { name: "" } });
      const screens = generateSmartProfilingScreens(brain);
      expect(screens.length).toBeGreaterThan(0);
      expect(screens.some(s => s.id === "review")).toBe(true);
    });

    it("includes review screen", () => {
      const brain = createMockBrain();
      const screens = generateSmartProfilingScreens(brain);
      expect(screens.some(s => s.id === "review")).toBe(true);
    });

    it("generates screens based on missing domains", () => {
      const brain = createMockBrain();
      const screens = generateSmartProfilingScreens(brain);
      // Should generate screens for missing domains
      expect(screens.length).toBeGreaterThan(0);
    });

    it("last screen is always review", () => {
      const brain = createMockBrain();
      const screens = generateSmartProfilingScreens(brain);
      expect(screens[screens.length - 1].id).toBe("review");
    });

    it("review screen has no questions", () => {
      const brain = createMockBrain();
      const screens = generateSmartProfilingScreens(brain);
      const reviewScreen = screens.find(s => s.id === "review");
      expect(reviewScreen?.questions).toHaveLength(0);
    });

    it("brand screen is single select when present", () => {
      const brain = createMockBrain({ brand: null });
      const screens = generateSmartProfilingScreens(brain);
      const brandScreen = screens.find(s => s.questions.some(q => q.id === "brand"));
      if (brandScreen) {
        expect(brandScreen.questions[0]?.selection_mode).toBe("single");
      }
    });

    it("ai_rules screen is single select when present", () => {
      const brain = createMockBrain();
      const screens = generateSmartProfilingScreens(brain);
      const aiRulesScreen = screens.find(s => s.questions.some(q => q.id === "ai_rules"));
      if (aiRulesScreen) {
        expect(aiRulesScreen.questions[0]?.selection_mode).toBe("single");
      }
    });

    it("conversion screen is single select when present", () => {
      const brain = createMockBrain({ goals: [] });
      const screens = generateSmartProfilingScreens(brain);
      const convScreen = screens.find(s => s.questions.some(q => q.id === "conversion"));
      if (convScreen) {
        expect(convScreen.questions[0]?.selection_mode).toBe("single");
      }
    });
  });

  describe("getNextMissingDomain", () => {
    it("returns a domain when there are missing domains", () => {
      const brain = createMockBrain({ business: { name: "" } });
      const next = getNextMissingDomain(brain, []);
      expect(next).toBeTruthy();
    });

    it("skips already answered domains", () => {
      const brain = createMockBrain({ business: { name: "" } });
      const first = getNextMissingDomain(brain, []);
      const second = getNextMissingDomain(brain, first ? [first] : []);
      expect(second).toBeTruthy();
      if (first && second) {
        expect(second).not.toBe(first);
      }
    });
  });

  describe("getProfilingProgress", () => {
    it("returns correct progress structure", () => {
      const brain = createMockBrain();
      const progress = getProfilingProgress(brain, []);
      expect(progress).toHaveProperty("score");
      expect(progress).toHaveProperty("remaining");
      expect(progress).toHaveProperty("total");
      expect(typeof progress.score).toBe("number");
      expect(typeof progress.remaining).toBe("number");
      expect(typeof progress.total).toBe("number");
    });

    it("score is between 0 and 100", () => {
      const brain = createMockBrain();
      const progress = getProfilingProgress(brain, []);
      expect(progress.score).toBeGreaterThanOrEqual(0);
      expect(progress.score).toBeLessThanOrEqual(100);
    });

    it("decreases remaining as domains answered", () => {
      const brain = createMockBrain();
      const progress1 = getProfilingProgress(brain, []);
      const progress2 = getProfilingProgress(brain, ["identity"]);
      expect(progress2.remaining).toBeLessThanOrEqual(progress1.remaining);
    });
  });
});
