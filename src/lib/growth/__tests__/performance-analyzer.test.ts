import { checkDataSufficiency } from "../performance-analyzer";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

jest.mock("@/lib/ai/provider", () => ({
  createAIProvider: jest.fn(() => ({
    generate: jest.fn(() => Promise.resolve("{}")),
  })),
}));

beforeEach(() => {
  if (typeof globalThis.crypto === "undefined") {
    (globalThis as any).crypto = { randomUUID: () => `mock-${Math.random().toString(36).slice(2)}` };
  } else if (!globalThis.crypto.randomUUID) {
    (globalThis.crypto as any).randomUUID = () => `mock-${Math.random().toString(36).slice(2)}` as any;
  }
  jest.clearAllMocks();
});

describe("Growth Strategist Performance Analyzer", () => {
  describe("checkDataSufficiency", () => {
    it("warns when total posts < 5", () => {
      const baselines = {
        totalPosts: 3, totalLeads: 10,
        pillars: [{ pillar: "Education", posts: 2, leads: 5, avgLeadsPerPost: 2.5 }],
        personas: [], formats: [], platforms: [],
      };
      const result = checkDataSufficiency(baselines);
      expect(result.sufficient).toBe(false);
      expect(result.warnings.some((w: string) => w.includes("Insufficient content data"))).toBe(true);
    });

    it("passes with sufficient data", () => {
      const baselines = {
        totalPosts: 10, totalLeads: 10,
        pillars: [
          { pillar: "Education", posts: 5, leads: 5, avgLeadsPerPost: 1 },
          { pillar: "Promotion", posts: 5, leads: 3, avgLeadsPerPost: 0.6 },
        ],
        personas: [
          { persona: "Event Organizer", posts: 5, qualifiedLeads: 5, conversionRate: 0.5 },
          { persona: "General", posts: 5, qualifiedLeads: 3, conversionRate: 0.3 },
        ],
        formats: [{ format: "carousel", posts: 5, saves: 10 }, { format: "image", posts: 5, saves: 5 }],
        platforms: [{ platform: "instagram", posts: 5, qualifiedLeads: 5, conversionRate: 0.5 }, { platform: "facebook", posts: 5, qualifiedLeads: 3, conversionRate: 0.3 }],
      };
      const result = checkDataSufficiency(baselines);
      expect(result.sufficient).toBe(true);
    });
  });
});
