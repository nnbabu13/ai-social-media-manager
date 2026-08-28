import type { BusinessBrainContext } from "@/types/business-brain";
import type {
  ProfilingScreen,
  ProfilingQuestion,
  ProfilingStage,
} from "@/types/business-profiling";
import { evaluateBusinessBrainReadiness } from "@/lib/business-brain/domains";
import type { BrainDomain, DomainReadiness } from "@/types/brain-readiness";

// Domain-to-stage mapping for backwards compatibility
const DOMAIN_TO_STAGE: Record<string, ProfilingStage> = {
  audience: "customer_segments",
  customer_needs: "customer_needs",
  customer_questions: "customer_needs",
  customer_journey: "conversion_actions",
  conversion: "conversion_actions",
  content_strategy: "content_interests",
  positioning: "differentiators",
  brand: "communication_preferences",
};

// Category-specific options
const CATEGORY_OPTIONS: Record<string, Record<string, Array<{ id: string; label: string }>>> = {
  restaurant: {
    customer_needs: [
      { id: "quick_meal", label: "Quick meal" },
      { id: "dine_in", label: "Dine-in experience" },
      { id: "takeaway", label: "Takeaway" },
      { id: "healthy", label: "Healthy options" },
      { id: "budget", label: "Budget friendly" },
      { id: "premium", label: "Premium quality" },
      { id: "variety", label: "Menu variety" },
      { id: "delivery", label: "Home delivery" },
    ],
    buying_triggers: [
      { id: "taste", label: "Taste / Flavor" },
      { id: "convenience", label: "Convenience" },
      { id: "price", label: "Price / Deals" },
      { id: "reviews", label: "Online reviews" },
      { id: "recommendations", label: "Friend recommendations" },
      { id: "ambiance", label: "Ambiance" },
      { id: "location", label: "Location" },
    ],
    objections: [
      { id: "long_wait", label: "Long wait times" },
      { id: "inconsistent", label: "Inconsistent quality" },
      { id: "high_prices", label: "High prices" },
      { id: "limited_menu", label: "Limited menu" },
      { id: "poor_service", label: "Poor service" },
      { id: "hygiene", label: "Hygiene concerns" },
    ],
    content_interests: [
      { id: "food_photos", label: "Food photos" },
      { id: "behind_scenes", label: "Behind the scenes" },
      { id: "reviews", label: "Customer reviews" },
      { id: "specials", label: "Daily specials" },
      { id: "recipes", label: "Recipe tips" },
      { id: "events", label: "Events" },
    ],
  },
  salon: {
    customer_needs: [
      { id: "haircut", label: "Haircut & styling" },
      { id: "coloring", label: "Hair coloring" },
      { id: "bridal", label: "Bridal packages" },
      { id: "skincare", label: "Skin care" },
      { id: "affordable", label: "Affordable grooming" },
      { id: "premium", label: "Premium services" },
    ],
    buying_triggers: [
      { id: "occasion", label: "Special occasion" },
      { id: "maintenance", label: "Regular maintenance" },
      { id: "new_look", label: "Want a new look" },
      { id: "referral", label: "Friend referral" },
      { id: "portfolio", label: "Portfolio / Before-after" },
      { id: "deals", label: "Price deals" },
    ],
    objections: [
      { id: "bad_experience", label: "Past bad experience" },
      { id: "inconsistent", label: "Inconsistent results" },
      { id: "overcharging", label: "Overcharging" },
      { id: "rude_staff", label: "Unfriendly staff" },
      { id: "waiting", label: "Long waiting" },
      { id: "safety", label: "Product safety concerns" },
    ],
    content_interests: [
      { id: "before_after", label: "Before & after" },
      { id: "tips", label: "Styling tips" },
      { id: "trends", label: "Trending styles" },
      { id: "offers", label: "Offers & discounts" },
      { id: "testimonials", label: "Client testimonials" },
    ],
  },
};

const DEFAULT_OPTIONS: Record<string, Array<{ id: string; label: string }>> = {
  customer_needs: [
    { id: "quality", label: "Quality products / services" },
    { id: "affordability", label: "Affordable pricing" },
    { id: "convenience", label: "Convenience" },
    { id: "speed", label: "Fast delivery / service" },
    { id: "expertise", label: "Expert advice" },
    { id: "trust", label: "Trust & reliability" },
    { id: "variety", label: "Wide selection" },
    { id: "customization", label: "Customization" },
  ],
  buying_triggers: [
    { id: "price", label: "Price / Deals" },
    { id: "quality", label: "Quality reputation" },
    { id: "reviews", label: "Online reviews" },
    { id: "recommendations", label: "Word of mouth" },
    { id: "convenience", label: "Convenience / Location" },
    { id: "urgency", label: "Urgent need" },
  ],
  objections: [
    { id: "high_prices", label: "High prices" },
    { id: "poor_quality", label: "Poor quality" },
    { id: "bad_service", label: "Bad customer service" },
    { id: "long_wait", label: "Long wait times" },
    { id: "limited_options", label: "Limited options" },
    { id: "trust_issues", label: "Trust / Reliability issues" },
  ],
  content_interests: [
    { id: "product_photos", label: "Product / Service photos" },
    { id: "tips", label: "Tips & advice" },
    { id: "offers", label: "Offers & promotions" },
    { id: "testimonials", label: "Customer testimonials" },
    { id: "behind_scenes", label: "Behind the scenes" },
    { id: "educational", label: "Educational content" },
  ],
  conversion_actions: [
    { id: "purchase", label: "Make a purchase" },
    { id: "contact", label: "Contact / Call us" },
    { id: "visit_store", label: "Visit our store" },
    { id: "book_service", label: "Book a service" },
    { id: "follow_social", label: "Follow on social media" },
    { id: "refer_friend", label: "Refer a friend" },
  ],
  differentiators: [
    { id: "quality", label: "Superior quality" },
    { id: "price", label: "Competitive pricing" },
    { id: "experience", label: "Years of experience" },
    { id: "service", label: "Excellent customer service" },
    { id: "local", label: "Local / Community focus" },
    { id: "unique", label: "Unique product / service" },
  ],
};

interface ProfilingScreenConfig {
  domain: string;
  title: string;
  description: string;
  questionTitle: string;
  options: Array<{ id: string; label: string }>;
  selectionMode: "single" | "multiple";
  required: boolean;
}

function getOptionsForDomain(category: string | null, domain: string): Array<{ id: string; label: string }> {
  if (category) {
    const normalized = category.toLowerCase().trim();
    for (const [key, options] of Object.entries(CATEGORY_OPTIONS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        if (options[domain]) return options[domain];
      }
    }
  }
  return DEFAULT_OPTIONS[domain] || [];
}

function getScreenConfig(domain: string, brain: BusinessBrainContext): ProfilingScreenConfig | null {
  const category = brain.business.category;
  const options = getOptionsForDomain(category, domain);

  switch (domain) {
    case "customer_needs":
      return {
        domain,
        title: "What do your customers care about?",
        description: "Select the things that matter most to your customers.",
        questionTitle: "What do your customers value most?",
        options,
        selectionMode: "multiple",
        required: false,
      };

    case "customer_questions":
      return {
        domain,
        title: "What do customers often ask?",
        description: "Select the questions customers typically have.",
        questionTitle: "What questions do customers usually ask?",
        options: [
          { id: "pricing", label: "Pricing information" },
          { id: "availability", label: "Product availability" },
          { id: "delivery", label: "Delivery options" },
          { id: "returns", label: "Returns & refunds" },
          { id: "warranty", label: "Warranty / guarantee" },
          { id: "hours", label: "Business hours" },
          { id: "location", label: "Location / directions" },
          { id: "customization", label: "Customization options" },
        ],
        selectionMode: "multiple",
        required: false,
      };

    case "customer_journey":
      return {
        domain,
        title: "How do customers find and buy from you?",
        description: "Select the main steps in your customer's journey.",
        questionTitle: "What's the typical customer journey?",
        options: [
          { id: "social_media", label: "Discovers on social media" },
          { id: "search", label: "Finds via Google search" },
          { id: "referral", label: "Referred by friend" },
          { id: "walk_in", label: "Walks in" },
          { id: "calls", label: "Calls first" },
          { id: "whatsapp", label: "Messages on WhatsApp" },
          { id: "website", label: "Visits website" },
          { id: "repeat", label: "Repeat customer" },
        ],
        selectionMode: "multiple",
        required: false,
      };

    case "conversion":
      return {
        domain,
        title: "What should customers do next?",
        description: "Select the main action you want customers to take.",
        questionTitle: "What's your primary conversion goal?",
        options: [
          { id: "purchase", label: "Make a purchase" },
          { id: "contact", label: "Contact / Call us" },
          { id: "visit", label: "Visit our location" },
          { id: "book", label: "Book a service" },
          { id: "whatsapp", label: "Send a WhatsApp message" },
          { id: "follow", label: "Follow on social media" },
          { id: "refer", label: "Refer a friend" },
          { id: "signup", label: "Sign up / Register" },
        ],
        selectionMode: "single",
        required: true,
      };

    case "brand":
      return {
        domain,
        title: "How should your business sound?",
        description: "Select the tone that best fits your brand.",
        questionTitle: "What's your brand personality?",
        options: [
          { id: "friendly", label: "Friendly & warm" },
          { id: "professional", label: "Professional" },
          { id: "casual", label: "Casual & relaxed" },
          { id: "luxurious", label: "Luxurious & premium" },
          { id: "playful", label: "Fun & playful" },
          { id: "authoritative", label: "Authoritative & expert" },
          { id: "technical", label: "Technical & precise" },
          { id: "inspirational", label: "Inspirational" },
        ],
        selectionMode: "single",
        required: true,
      };

    case "positioning":
      return {
        domain,
        title: "What makes you different?",
        description: "Select what sets your business apart from competitors.",
        questionTitle: "What's your competitive advantage?",
        options,
        selectionMode: "multiple",
        required: false,
      };

    case "content_strategy":
      return {
        domain,
        title: "What content engages your customers?",
        description: "Select the types of content your customers enjoy.",
        questionTitle: "What content should we create?",
        options,
        selectionMode: "multiple",
        required: false,
      };

    case "policies":
      return {
        domain,
        title: "Business policies",
        description: "Help us understand your policies for AI responses.",
        questionTitle: "What policies should the AI follow?",
        options: [
          { id: "pricing_public", label: "Share pricing publicly" },
          { id: "pricing_private", label: "Ask before sharing prices" },
          { id: "discounts_ok", label: "Can offer discounts" },
          { id: "discounts_approval", label: "Need approval for discounts" },
          { id: "refunds_ok", label: "Can discuss refunds" },
          { id: "refunds_approval", label: "Need approval for refunds" },
        ],
        selectionMode: "multiple",
        required: false,
      };

    case "ai_rules":
      return {
        domain,
        title: "AI operating rules",
        description: "How much freedom should the AI have?",
        questionTitle: "What should the AI be allowed to do?",
        options: [
          { id: "assistant", label: "Always ask before posting" },
          { id: "semi_autonomous", label: "Post simple content, ask for important stuff" },
          { id: "autonomous", label: "Full autonomy within guidelines" },
        ],
        selectionMode: "single",
        required: true,
      };

    default:
      return null;
  }
}

export function generateSmartProfilingScreens(brain: BusinessBrainContext): ProfilingScreen[] {
  const readiness = evaluateBusinessBrainReadiness(brain);
  const missingDomains = readiness.required_missing;

  if (missingDomains.length === 0) {
    return [
      {
        id: "review",
        title: "Your Business Brain is ready",
        description: "All required information has been collected. Let's review.",
        questions: [],
      },
    ];
  }

  const screens: ProfilingScreen[] = [];
  let screenIndex = 0;

  for (const domain of missingDomains) {
    const config = getScreenConfig(domain.domain, brain);
    if (!config) continue;

    const question: ProfilingQuestion = {
      id: domain.domain,
      title: config.questionTitle,
      description: config.description,
      stage: DOMAIN_TO_STAGE[domain.domain] || "customer_needs",
      selection_mode: config.selectionMode,
      options: config.options,
      allow_other: true,
      allow_none: !config.required,
      required: config.required,
    };

    screens.push({
      id: `screen_${screenIndex}`,
      title: config.title,
      description: config.description,
      questions: [question],
    });

    screenIndex++;
  }

  screens.push({
    id: "review",
    title: "Review your profile",
    description: "Here's what we've collected. You can review before we finalize.",
    questions: [],
  });

  return screens;
}

export function getNextMissingDomain(brain: BusinessBrainContext, answeredDomains: string[]): string | null {
  const readiness = evaluateBusinessBrainReadiness(brain);
  const missingDomains = readiness.required_missing;

  for (const domain of missingDomains) {
    if (!answeredDomains.includes(domain.domain)) {
      return domain.domain;
    }
  }

  return null;
}

export function getProfilingProgress(brain: BusinessBrainContext, answeredDomains: string[]): {
  score: number;
  remaining: number;
  total: number;
} {
  const readiness = evaluateBusinessBrainReadiness(brain);
  const missingDomains = readiness.required_missing;
  const remaining = missingDomains.filter(d => !answeredDomains.includes(d.domain)).length;

  return {
    score: readiness.score,
    remaining,
    total: missingDomains.length,
  };
}
