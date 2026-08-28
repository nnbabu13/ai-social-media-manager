import type { BusinessBrainContext } from "@/types/business-brain";
import type {
  SocialStrategy,
  ContentPillar,
  ContentMixItem,
  ContentFormat,
  PostingCadence,
  PlatformStrategy,
  ConversionStrategy,
  CTAStrategy,
  ContentRules,
  StrategyObjective,
} from "@/types/social-strategy";

interface StrategyGenerationResult {
  strategy: Omit<SocialStrategy, "id">;
  pillars: Omit<ContentPillar, "id" | "strategy_id">[];
}

function derivePrimaryObjective(
  goals: BusinessBrainContext["goals"]
): StrategyObjective {
  if (goals.length > 0) {
    const primaryGoal = goals.find(g => g.is_primary) || goals[0];
    const goal = primaryGoal.goal.toLowerCase();

    if (goal.includes("lead") || goal.includes("enquir")) {
      return { objective: "Generate leads", description: "Attract potential customers and capture their contact information", priority: "primary" };
    }
    if (goal.includes("book") || goal.includes("reservation")) {
      return { objective: "Get bookings", description: "Drive reservations and appointments", priority: "primary" };
    }
    if (goal.includes("sale") || goal.includes("revenue") || goal.includes("purchase")) {
      return { objective: "Increase sales", description: "Drive direct purchases and revenue", priority: "primary" };
    }
    if (goal.includes("traffic") || goal.includes("website") || goal.includes("visit")) {
      return { objective: "Drive website traffic", description: "Increase visitors to the business website", priority: "primary" };
    }
    if (goal.includes("aware") || goal.includes("brand")) {
      return { objective: "Build awareness", description: "Increase visibility and brand recognition", priority: "primary" };
    }
    if (goal.includes("engag") || goal.includes("follow")) {
      return { objective: "Increase engagement", description: "Build active community interaction", priority: "primary" };
    }
    if (goal.includes("repeat") || goal.includes("loyal") || goal.includes("retain")) {
      return { objective: "Increase repeat customers", description: "Encourage customer loyalty and return visits", priority: "primary" };
    }

    return { objective: primaryGoal.goal, description: primaryGoal.goal, priority: "primary" };
  }

  return { objective: "Build awareness", description: "Increase visibility and brand recognition", priority: "primary" };
}

function deriveContentPillars(
  brain: BusinessBrainContext,
  objective: StrategyObjective
): Omit<ContentPillar, "id" | "strategy_id">[] {
  const category = brain.business.category?.toLowerCase() || "";
  const hasProducts = brain.products.length > 0;
  const hasServices = brain.services.length > 0;
  const hasOffers = brain.offers.length > 0;
  const hasPersonas = brain.customer_personas && brain.customer_personas.length > 0;

  const pillars: Omit<ContentPillar, "id" | "strategy_id">[] = [];

  if (hasProducts || hasServices) {
    const offerings = hasProducts ? "Products" : "Services";
    pillars.push({
      business_id: "",
      name: `${offerings} Showcase`,
      description: `Highlight your ${offerings.toLowerCase()} and their benefits`,
      purpose: "sales",
      target_personas: hasPersonas ? brain.customer_personas!.map(p => p.name) : [],
      priority: "primary",
      recommended_percentage: 25,
      example_topics: hasProducts
        ? brain.products.slice(0, 3).map(p => `${p.name} benefits`)
        : brain.services.slice(0, 3).map(s => `${s.name} overview`),
      enabled: true,
      source_type: "ai_derived",
      approval_status: "pending",
    });
  }

  if (category.includes("restaurant") || category.includes("food") || category.includes("cafe")) {
    pillars.push({
      business_id: "",
      name: "Food & Menu",
      description: "Showcase dishes, ingredients, and menu highlights",
      purpose: "sales",
      target_personas: hasPersonas ? brain.customer_personas!.map(p => p.name) : [],
      priority: "primary",
      recommended_percentage: 30,
      example_topics: ["Daily specials", "Chef's recommendation", "Seasonal dishes", "Behind the kitchen"],
      enabled: true,
      source_type: "ai_derived",
      approval_status: "pending",
    });
  }

  if (category.includes("salon") || category.includes("beauty") || category.includes("spa")) {
    pillars.push({
      business_id: "",
      name: "Transformations",
      description: "Before/after results and client stories",
      purpose: "trust",
      target_personas: hasPersonas ? brain.customer_personas!.map(p => p.name) : [],
      priority: "primary",
      recommended_percentage: 25,
      example_topics: ["Before & after", "Client transformations", "Stylist spotlights", "Beauty tips"],
      enabled: true,
      source_type: "ai_derived",
      approval_status: "pending",
    });
  }

  if (category.includes("real estate") || category.includes("property")) {
    pillars.push({
      business_id: "",
      name: "Property Listings",
      description: "Showcase available properties and features",
      purpose: "sales",
      target_personas: hasPersonas ? brain.customer_personas!.map(p => p.name) : [],
      priority: "primary",
      recommended_percentage: 30,
      example_topics: ["New listings", "Property features", "Virtual tours", "Price highlights"],
      enabled: true,
      source_type: "ai_derived",
      approval_status: "pending",
    });

    pillars.push({
      business_id: "",
      name: "Buyer Education",
      description: "Help buyers understand the purchasing process",
      purpose: "education",
      target_personas: hasPersonas ? brain.customer_personas!.map(p => p.name) : [],
      priority: "secondary",
      recommended_percentage: 20,
      example_topics: ["Buying process explained", "Mortgage tips", "First-time buyer guide", "Market insights"],
      enabled: true,
      source_type: "ai_derived",
      approval_status: "pending",
    });
  }

  if (objective.objective.toLowerCase().includes("lead") || objective.objective.toLowerCase().includes("enquir")) {
    pillars.push({
      business_id: "",
      name: "Social Proof",
      description: "Customer testimonials, reviews, and success stories",
      purpose: "trust",
      target_personas: hasPersonas ? brain.customer_personas!.map(p => p.name) : [],
      priority: "secondary",
      recommended_percentage: 20,
      example_topics: ["Customer reviews", "Success stories", "Testimonials", "Case studies"],
      enabled: true,
      source_type: "ai_derived",
      approval_status: "pending",
    });
  }

  if (brain.brand?.tone) {
    pillars.push({
      business_id: "",
      name: "Behind the Scenes",
      description: "Show the people and process behind the business",
      purpose: "engagement",
      target_personas: hasPersonas ? brain.customer_personas!.map(p => p.name) : [],
      priority: "secondary",
      recommended_percentage: 15,
      example_topics: ["Meet the team", "Day in the life", "Process insight", "Company culture"],
      enabled: true,
      source_type: "ai_derived",
      approval_status: "pending",
    });
  }

  if (brain.facts.some(f => f.category === "education" || f.category === "tips")) {
    pillars.push({
      business_id: "",
      name: "Education & Tips",
      description: "Share useful knowledge related to your industry",
      purpose: "education",
      target_personas: hasPersonas ? brain.customer_personas!.map(p => p.name) : [],
      priority: "secondary",
      recommended_percentage: 15,
      example_topics: ["How-to guides", "Industry tips", "Common mistakes", "Best practices"],
      enabled: true,
      source_type: "ai_derived",
      approval_status: "pending",
    });
  }

  if (hasOffers) {
    pillars.push({
      business_id: "",
      name: "Offers & Promotions",
      description: "Share deals, discounts, and special offers",
      purpose: "sales",
      target_personas: hasPersonas ? brain.customer_personas!.map(p => p.name) : [],
      priority: "secondary",
      recommended_percentage: 10,
      example_topics: ["Current promotions", "Limited offers", "Seasonal deals", "Referral rewards"],
      enabled: true,
      source_type: "ai_derived",
      approval_status: "pending",
    });
  }

  if (pillars.length < 4) {
    pillars.push({
      business_id: "",
      name: "Community & Tips",
      description: "Share helpful tips and engage with the local community",
      purpose: "community",
      target_personas: hasPersonas ? brain.customer_personas!.map(p => p.name) : [],
      priority: "secondary",
      recommended_percentage: 15,
      example_topics: ["Local events", "Community stories", "Helpful tips", "Industry news"],
      enabled: true,
      source_type: "ai_derived",
      approval_status: "pending",
    });
  }

  const totalPercentage = pillars.reduce((sum, p) => sum + p.recommended_percentage, 0);
  if (totalPercentage !== 100) {
    const adjustment = 100 - totalPercentage;
    if (pillars.length > 0) {
      pillars[0].recommended_percentage += adjustment;
    }
  }

  return pillars;
}

function deriveContentMix(
  objective: StrategyObjective,
  pillars: Omit<ContentPillar, "id" | "strategy_id">[]
): ContentMixItem[] {
  const obj = objective.objective.toLowerCase();

  if (obj.includes("lead") || obj.includes("enquir")) {
    return [
      { category: "Educational", percentage: 35, description: "Helpful content that builds trust" },
      { category: "Social Proof", percentage: 25, description: "Testimonials and success stories" },
      { category: "Product/Service", percentage: 25, description: "Showcase offerings and benefits" },
      { category: "Promotional", percentage: 15, description: "Direct offers and CTAs" },
    ];
  }

  if (obj.includes("sale") || obj.includes("revenue")) {
    return [
      { category: "Product/Service", percentage: 35, description: "Direct product and service content" },
      { category: "Educational", percentage: 25, description: "Helpful content that builds expertise" },
      { category: "Social Proof", percentage: 20, description: "Customer stories and reviews" },
      { category: "Promotional", percentage: 20, description: "Offers and conversion content" },
    ];
  }

  if (obj.includes("aware") || obj.includes("brand")) {
    return [
      { category: "Educational", percentage: 30, description: "Informative content for reach" },
      { category: "Engagement", percentage: 25, description: "Interactive and shareable content" },
      { category: "Behind the Scenes", percentage: 25, description: "Humanize the brand" },
      { category: "Social Proof", percentage: 20, description: "Build credibility" },
    ];
  }

  return [
    { category: "Educational", percentage: 30, description: "Helpful content that builds trust" },
    { category: "Product/Service", percentage: 25, description: "Showcase offerings" },
    { category: "Social Proof", percentage: 25, description: "Customer stories and reviews" },
    { category: "Promotional", percentage: 20, description: "Offers and conversion content" },
  ];
}

function derivePreferredFormats(
  category: string | null
): ContentFormat[] {
  const cat = category?.toLowerCase() || "";

  if (cat.includes("restaurant") || cat.includes("food")) {
    return [
      { format: "Reel", priority: "high", platforms: ["instagram", "tiktok"] },
      { format: "Image", priority: "high", platforms: ["instagram", "facebook"] },
      { format: "Carousel", priority: "medium", platforms: ["instagram", "linkedin"] },
      { format: "Story", priority: "high", platforms: ["instagram", "facebook"] },
    ];
  }

  if (cat.includes("salon") || cat.includes("beauty")) {
    return [
      { format: "Reel", priority: "high", platforms: ["instagram", "tiktok"] },
      { format: "Carousel", priority: "high", platforms: ["instagram"] },
      { format: "Image", priority: "medium", platforms: ["instagram", "facebook"] },
      { format: "Story", priority: "high", platforms: ["instagram"] },
    ];
  }

  if (cat.includes("real estate") || cat.includes("property")) {
    return [
      { format: "Carousel", priority: "high", platforms: ["instagram", "linkedin"] },
      { format: "Image", priority: "high", platforms: ["instagram", "facebook"] },
      { format: "Reel", priority: "medium", platforms: ["instagram", "tiktok"] },
      { format: "Text Post", priority: "medium", platforms: ["linkedin", "facebook"] },
    ];
  }

  return [
    { format: "Image", priority: "high", platforms: ["instagram", "facebook"] },
    { format: "Carousel", priority: "medium", platforms: ["instagram", "linkedin"] },
    { format: "Reel", priority: "medium", platforms: ["instagram", "tiktok"] },
    { format: "Story", priority: "medium", platforms: ["instagram", "facebook"] },
  ];
}

function derivePostingCadence(
  category: string | null,
  objective: StrategyObjective
): PostingCadence {
  const cat = category?.toLowerCase() || "";
  const obj = objective.objective.toLowerCase();

  let postsPerWeek = 4;

  if (cat.includes("restaurant") || cat.includes("food") || cat.includes("cafe")) {
    postsPerWeek = 5;
  } else if (cat.includes("salon") || cat.includes("beauty")) {
    postsPerWeek = 4;
  } else if (cat.includes("real estate") || cat.includes("property")) {
    postsPerWeek = 3;
  } else if (obj.includes("aware") || obj.includes("engag")) {
    postsPerWeek = 5;
  } else if (obj.includes("lead") || obj.includes("sale")) {
    postsPerWeek = 4;
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const distribution = days.slice(0, postsPerWeek).map(day => ({
    day,
    preferred_formats: ["Image", "Carousel"],
  }));

  return {
    posts_per_week: postsPerWeek,
    distribution,
    flexibility: "ai_decides",
  };
}

function derivePlatformStrategy(
  category: string | null
): PlatformStrategy[] {
  const cat = category?.toLowerCase() || "";

  if (cat.includes("restaurant") || cat.includes("food") || cat.includes("salon") || cat.includes("beauty")) {
    return [
      { platform: "instagram", enabled: true, priority: "primary", objectives: ["Showcase products/services", "Build brand awareness", "Drive engagement"], preferred_formats: ["Reel", "Image", "Carousel", "Story"] },
      { platform: "facebook", enabled: true, priority: "secondary", objectives: ["Reach local audience", "Build community", "Share updates"], preferred_formats: ["Image", "Video", "Story"] },
    ];
  }

  if (cat.includes("real estate") || cat.includes("property")) {
    return [
      { platform: "instagram", enabled: true, priority: "primary", objectives: ["Showcase properties", "Build brand awareness"], preferred_formats: ["Carousel", "Image", "Reel"] },
      { platform: "linkedin", enabled: true, priority: "secondary", objectives: ["Professional networking", "Industry insights"], preferred_formats: ["Text Post", "Carousel"] },
    ];
  }

  return [
    { platform: "instagram", enabled: true, priority: "primary", objectives: ["Build brand awareness", "Showcase offerings"], preferred_formats: ["Image", "Carousel", "Reel"] },
    { platform: "facebook", enabled: true, priority: "secondary", objectives: ["Reach local audience", "Build community"], preferred_formats: ["Image", "Video"] },
  ];
}

function deriveConversionStrategy(
  brain: BusinessBrainContext,
  objective: StrategyObjective
): ConversionStrategy {
  const goal = objective.objective.toLowerCase();

  let primaryAction: ConversionStrategy["primary_action"] = "website";
  const secondaryActions: string[] = [];
  const journey: ConversionStrategy["journey"] = [];
  let preferredCTAStyle: ConversionStrategy["preferred_cta_style"] = "mixed";

  if (goal.includes("lead") || goal.includes("enquir")) {
    primaryAction = "whatsapp";
    secondaryActions.push("dm", "call");
    preferredCTAStyle = "soft";
    journey.push(
      { step: "Social Post", description: "User sees content" },
      { step: "Profile Visit", description: "User visits profile" },
      { step: "WhatsApp", description: "User sends message" },
      { step: "Enquiry", description: "User asks about product/service" },
      { step: "Quote", description: "Business provides quote" },
      { step: "Purchase", description: "User makes purchase" }
    );
  } else if (goal.includes("book")) {
    primaryAction = "booking";
    secondaryActions.push("whatsapp", "call");
    preferredCTAStyle = "direct";
    journey.push(
      { step: "Social Post", description: "User sees content" },
      { step: "Profile Visit", description: "User visits profile" },
      { step: "Booking", description: "User books appointment" },
      { step: "Confirmation", description: "Business confirms booking" },
      { step: "Service", description: "Service delivered" }
    );
  } else if (goal.includes("sale") || goal.includes("purchase")) {
    primaryAction = "purchase";
    secondaryActions.push("website", "whatsapp");
    preferredCTAStyle = "direct";
    journey.push(
      { step: "Social Post", description: "User sees content" },
      { step: "Product Interest", description: "User shows interest" },
      { step: "Website/Store", description: "User visits purchase point" },
      { step: "Purchase", description: "User completes purchase" }
    );
  } else {
    primaryAction = "website";
    secondaryActions.push("dm", "whatsapp");
    preferredCTAStyle = "mixed";
    journey.push(
      { step: "Social Post", description: "User sees content" },
      { step: "Profile Visit", description: "User visits profile" },
      { step: "Website Visit", description: "User visits website" },
      { step: "Engagement", description: "User takes desired action" }
    );
  }

  return { primary_action: primaryAction, secondary_actions: secondaryActions, journey, preferred_cta_style: preferredCTAStyle };
}

function deriveCTAStrategy(
  objective: StrategyObjective
): CTAStrategy[] {
  const goal = objective.objective.toLowerCase();

  if (goal.includes("lead") || goal.includes("enquir")) {
    return [
      { type: "soft", percentage: 35, examples: ["Save this for later", "Follow for more tips", "Tag someone who needs this"] },
      { type: "engagement", percentage: 30, examples: ["What do you think?", "Have you tried this?", "Drop a comment below"] },
      { type: "conversion", percentage: 25, examples: ["Message us for details", "WhatsApp us", "Send us a DM"] },
      { type: "direct_sales", percentage: 10, examples: ["Book now", "Get a free quote"] },
    ];
  }

  if (goal.includes("sale") || goal.includes("purchase")) {
    return [
      { type: "soft", percentage: 20, examples: ["Save this for later", "Check the link in bio"] },
      { type: "engagement", percentage: 20, examples: ["What's your favorite?", "Tag a friend"] },
      { type: "conversion", percentage: 35, examples: ["Shop now", "Order today", "Get yours"] },
      { type: "direct_sales", percentage: 25, examples: ["Buy now", "Limited offer", "Order before it's gone"] },
    ];
  }

  return [
    { type: "soft", percentage: 30, examples: ["Save this for later", "Follow for more"] },
    { type: "engagement", percentage: 30, examples: ["What do you think?", "Share your experience"] },
    { type: "conversion", percentage: 25, examples: ["Learn more", "Visit us", "Contact us"] },
    { type: "direct_sales", percentage: 15, examples: ["Book now", "Get started"] },
  ];
}

function deriveContentRules(
  brain: BusinessBrainContext
): ContentRules {
  const emphasize: string[] = [];
  const avoid: string[] = [];

  if (brain.business.category) {
    emphasize.push("Quality products/services");
  }

  if (brain.brand?.tone) {
    emphasize.push(`${brain.brand.tone} communication`);
  }

  if (brain.business.city || brain.business.region) {
    emphasize.push("Local community focus");
  }

  if (brain.brand?.forbidden_phrases && brain.brand.forbidden_phrases.length > 0) {
    avoid.push(...brain.brand.forbidden_phrases);
  }

  if (brain.brand?.avoid_words) {
    avoid.push(brain.brand.avoid_words);
  }

  avoid.push("Aggressive sales language");
  avoid.push("Competitor attacks");
  avoid.push("Unsupported claims");
  avoid.push("Political content");

  return {
    always_emphasize: emphasize,
    avoid: avoid,
    tone_guidelines: brain.brand?.style_description || undefined,
  };
}

export function generateSocialStrategy(
  brain: BusinessBrainContext
): StrategyGenerationResult {
  const primaryObjective = derivePrimaryObjective(brain.goals);
  const pillars = deriveContentPillars(brain, primaryObjective);
  const contentMix = deriveContentMix(primaryObjective, pillars);
  const preferredFormats = derivePreferredFormats(brain.business.category);
  const postingCadence = derivePostingCadence(brain.business.category, primaryObjective);
  const platformStrategy = derivePlatformStrategy(brain.business.category);
  const conversionStrategy = deriveConversionStrategy(brain, primaryObjective);
  const ctaStrategy = deriveCTAStrategy(primaryObjective);
  const contentRules = deriveContentRules(brain);

  const targetPersonas = (brain.customer_personas || []).map(p => ({
    persona_id: p.id,
    name: p.name,
    priority: p.priority as "primary" | "secondary",
  }));

  const explanation = `Based on your ${brain.business.category || "business"} and primary goal to ${primaryObjective.objective.toLowerCase()}, we recommend a content strategy focused on building trust through ${contentMix[0]?.category || "educational"} content, supported by ${contentMix[1]?.category || "product"} content. We'll post ${postingCadence.posts_per_week} times per week with a mix of ${preferredFormats.map(f => f.format).join(", ")} formats.`;

  const strategy: Omit<SocialStrategy, "id"> = {
    business_id: "",
    primary_objective: primaryObjective,
    secondary_objectives: [],
    target_personas: targetPersonas,
    content_pillars: [],
    content_mix: contentMix,
    preferred_formats: preferredFormats,
    posting_cadence: postingCadence,
    platform_strategy: platformStrategy,
    conversion_strategy: conversionStrategy,
    cta_strategy: ctaStrategy,
    content_rules: contentRules,
    strategy_status: "review",
    source_type: "ai_derived",
    explanation,
  };

  return { strategy, pillars };
}

export function validateContentMixPercentages(mix: ContentMixItem[]): {
  valid: boolean;
  remaining: number;
} {
  const total = mix.reduce((sum, item) => sum + item.percentage, 0);
  return {
    valid: total === 100,
    remaining: 100 - total,
  };
}
