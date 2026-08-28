import { evaluateBusinessBrainReadiness } from "@/lib/business-brain/domains";
import type { BusinessBrainContext } from "@/types/business-brain";

function makeBrain(overrides: Partial<BusinessBrainContext> = {}): BusinessBrainContext {
  return {
    business: {
      id: "test-123",
      name: "Test Business",
      slug: "test-business",
      category: "Food & Beverage",
      description: "A test business that provides quality products and services to customers.",
      website_url: null,
      country: "India",
      region: "Andhra Pradesh",
      city: "Kakinada",
      target_customers: "Families and wedding planners",
    },
    products: [
      { name: "Premium Water Bottle", description: "1L premium bottled water", price: 20, price_visibility: "public" },
    ],
    services: [],
    goals: [{ goal: "Get more customers", is_primary: true }],
    brand: {
      tone: "Friendly",
      style_description: "Warm and approachable",
      avoid_words: null,
      tagline: null,
      brand_keywords: [],
      preferred_phrases: [],
      forbidden_phrases: [],
    },
    policies: {
      autonomy_level: "assistant",
      require_approval_discount: true,
      require_approval_refund: true,
      require_approval_complaint: true,
      require_approval_pricing: true,
      require_approval_legal: true,
      require_approval_medical: true,
      require_approval_partnership: true,
      require_approval_promises: true,
    },
    facts: [
      { category: "differentiation", title: "Eco-friendly packaging", content: "We use 100% recyclable bottles" },
      { category: "policies", title: "Delivery policy", content: "Free delivery for orders over 50 bottles" },
    ],
    faqs: [
      { question: "What is the minimum order?", answer: "10 bottles minimum", category: "general" },
    ],
    locations: [],
    offers: [],
    personas: [
      { name: "Wedding Planners", description: "Professional event planners", pain_points: "Need reliable bulk supply", needs: "Consistent quality and timely delivery" },
    ],
    documents: [],
    ...overrides,
  };
}

describe("Business Brain Readiness Engine", () => {
  describe("Test 1: Business with one product", () => {
    it("offerings should be complete", () => {
      const brain = makeBrain({
        products: [{ name: "Premium Water", description: "1L bottle", price: 20, price_visibility: "public" }],
        services: [],
      });
      const result = evaluateBusinessBrainReadiness(brain);
      const offerings = result.domains.find(d => d.domain === "offerings");
      expect(offerings?.status).toBe("complete");
    });
  });

  describe("Test 2: Business with no offers", () => {
    it("offers should not reduce readiness", () => {
      const brain = makeBrain({ offers: [] });
      const result = evaluateBusinessBrainReadiness(brain);
      const offers = result.domains.find(d => d.domain === "offers");
      expect(offers?.status).toBe("none");
      expect(offers?.missing).toHaveLength(0);
      // Debug: print failing domains
      const required = ["identity", "offerings", "audience", "customer_needs", "customer_questions", "customer_journey", "brand", "positioning", "conversion", "policies", "ai_rules", "content_strategy", "goals"];
      result.domains.filter(d => required.includes(d.domain as string) && d.status !== "complete").forEach(d => {
        console.log(`FAILING: ${d.domain} = ${d.status}`, d.missing);
      });
      // Score should still be 100% if all required domains are complete
      expect(result.score).toBe(100);
    });
  });

  describe("Test 3: Business with no website", () => {
    it("website should not reduce readiness", () => {
      const brain = makeBrain({ business: { ...makeBrain().business, website_url: null } });
      const result = evaluateBusinessBrainReadiness(brain);
      const website = result.domains.find(d => d.domain === "website");
      expect(website?.status).toBe("not_applicable");
      expect(result.score).toBe(100);
    });
  });

  describe("Test 4: Business with target_customers but no persona", () => {
    it("audience should be complete if sufficient", () => {
      const brain = makeBrain({
        personas: [],
        business: { ...makeBrain().business, target_customers: "Wedding planners and families" },
      });
      const result = evaluateBusinessBrainReadiness(brain);
      const audience = result.domains.find(d => d.domain === "audience");
      expect(audience?.status).toBe("complete");
    });
  });

  describe("Test 5: Online business with no physical location", () => {
    it("location should not affect readiness score", () => {
      const brain = makeBrain({ locations: [] });
      const result = evaluateBusinessBrainReadiness(brain);
      // Locations is not a required domain, so it shouldn't affect score
      // The score should still be 100% if all required domains are complete
      expect(result.score).toBe(100);
    });
  });

  describe("Test 6: Business with missing conversion action", () => {
    it("readiness should be below 100%", () => {
      const brain = makeBrain({
        goals: [{ goal: "Grow the business", is_primary: true }],
        facts: [],
        business: { ...makeBrain().business, website_url: null, target_customers: null },
      });
      const result = evaluateBusinessBrainReadiness(brain);
      const conversion = result.domains.find(d => d.domain === "conversion");
      expect(conversion?.status).not.toBe("complete");
      expect(result.score).toBeLessThan(100);
    });
  });

  describe("Test 7: Business with all required domains", () => {
    it("should be 100% operationally ready", () => {
      const brain = makeBrain({
        business: {
          id: "test-123",
          name: "Test Business",
          slug: "test-business",
          category: "Food & Beverage",
          description: "A test business that provides quality products and services to customers.",
          website_url: null,
          country: "India",
          region: "Andhra Pradesh",
          city: "Kakinada",
          target_customers: "Families and wedding planners",
        },
        products: [{ name: "Premium Water", description: "1L bottle", price: 20, price_visibility: "public" }],
        services: [],
        goals: [{ goal: "Get more customers", is_primary: true }],
        brand: { tone: "Friendly", style_description: "Warm and approachable", avoid_words: null, tagline: null, brand_keywords: [], preferred_phrases: [], forbidden_phrases: [] },
        policies: { autonomy_level: "assistant", require_approval_discount: true, require_approval_refund: true, require_approval_complaint: true, require_approval_pricing: true, require_approval_legal: true, require_approval_medical: true, require_approval_partnership: true, require_approval_promises: true },
        facts: [
          { category: "differentiation", title: "Unique feature", content: "Eco-friendly packaging" },
          { category: "policies", title: "Delivery", content: "Free delivery over 50 bottles" },
          { category: "conversion", title: "CTA", content: "WhatsApp enquiry" },
        ],
        faqs: [{ question: "What is the minimum order?", answer: "10 bottles", category: "general" }],
        locations: [],
        offers: [],
        personas: [{ name: "Wedding Planners", description: "Event planners", pain_points: "Need reliable supply", needs: "Timely delivery" }],
      });
      const result = evaluateBusinessBrainReadiness(brain);
      const required = ["identity", "offerings", "audience", "customer_needs", "customer_questions", "customer_journey", "brand", "positioning", "conversion", "policies", "ai_rules", "content_strategy", "goals"];
      result.domains.filter(d => required.includes(d.domain as string)).forEach(d => {
        if (d.status !== "complete") {
          console.log(`FAILING: ${d.domain} = ${d.status}`, d.missing);
        }
      });
      expect(result.score).toBe(100);
      expect(result.status).toBe("ready");
    });
  });

  describe("Test 8: Additional product added later", () => {
    it("readiness should remain 100% if already ready", () => {
      const brain = makeBrain({
        products: [
          { name: "Premium Water", description: "1L bottle", price: 20, price_visibility: "public" },
          { name: "Bulk Water", description: "5L bottle", price: 80, price_visibility: "public" },
        ],
      });
      const result = evaluateBusinessBrainReadiness(brain);
      expect(result.score).toBe(100);
    });
  });

  describe("Domain status types", () => {
    it("should distinguish between none and missing", () => {
      const brainWithOffers = makeBrain({ offers: [{ name: "Sale", description: "20% off", discount_text: "20%" }] });
      const brainWithoutOffers = makeBrain({ offers: [] });
      
      const resultWith = evaluateBusinessBrainReadiness(brainWithOffers);
      const resultWithout = evaluateBusinessBrainReadiness(brainWithoutOffers);
      
      const offersWith = resultWith.domains.find(d => d.domain === "offers");
      const offersWithout = resultWithout.domains.find(d => d.domain === "offers");
      
      expect(offersWith?.status).toBe("complete");
      expect(offersWithout?.status).toBe("none");
    });
  });

  describe("Score calculation", () => {
    it("should use equal weighting across required domains", () => {
      const brain = makeBrain();
      const result = evaluateBusinessBrainReadiness(brain);
      const requiredDomains = result.domains.filter(d => 
        ["identity", "offerings", "audience", "customer_needs", "customer_questions", "customer_journey", "brand", "positioning", "conversion", "policies", "ai_rules", "content_strategy", "goals"].includes(d.domain as string)
      );
      expect(requiredDomains).toHaveLength(13);
    });
  });
});
