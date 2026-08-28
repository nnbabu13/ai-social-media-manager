import { validateContentClaims } from "../claim-validation";

describe("claim validation", () => {
  const brain = {
    name: "Test Business",
    category: "Restaurant",
    products: ["Pizza", "Pasta"],
    services: ["Dine-in", "Delivery"],
    facts: [
      { title: "Location", content: "We deliver within 10km", category: "operations" },
      { title: "Offer", content: "20% off on orders above ₹500", category: "offers" },
    ],
    faqs: [],
    goals: [],
    brand: {
      tone: "friendly",
      forbiddenPhrases: ["guaranteed", "best price"],
    },
  };

  it("passes for content with no claims", () => {
    const result = validateContentClaims(
      { caption: "Check out our new menu!" },
      brain
    );
    expect(result.valid).toBe(true);
    expect(result.unsupportedClaims).toHaveLength(0);
  });

  it("detects unsupported price claims", () => {
    const result = validateContentClaims(
      { caption: "Get 50% off everything today!" },
      brain
    );
    expect(result.valid).toBe(false);
    expect(result.unsupportedClaims.length).toBeGreaterThan(0);
  });

  it("allows price claims that match business facts", () => {
    const result = validateContentClaims(
      { caption: "20% off on orders above ₹500" },
      brain
    );
    expect(result.valid).toBe(true);
  });

  it("detects forbidden phrases", () => {
    const result = validateContentClaims(
      { caption: "We offer the best price guaranteed!" },
      brain
    );
    expect(result.valid).toBe(false);
    expect(result.unsupportedClaims.length).toBeGreaterThan(0);
  });

  it("warns about testimonials", () => {
    const result = validateContentClaims(
      { caption: "Our customer says this is the best pizza in town" },
      brain
    );
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("warns about delivery claims without facts", () => {
    const noDeliveryBrain = {
      ...brain,
      facts: [],
    };
    const result = validateContentClaims(
      { caption: "We deliver to all areas" },
      noDeliveryBrain
    );
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
