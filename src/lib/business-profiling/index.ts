import type { BusinessBrainContext } from "@/types/business-brain";
import type {
  ProfilingStage,
  ProfilingScreen,
  ProfilingQuestion,
} from "@/types/business-profiling";

const CATEGORY_OPTIONS: Record<string, Record<ProfilingStage, Array<{ id: string; label: string }>>> = {
  restaurant: {
    customer_segments: [
      { id: "families", label: "Families" },
      { id: "students", label: "Students" },
      { id: "office_workers", label: "Office workers" },
      { id: "couples", label: "Couples" },
      { id: "tourists", label: "Tourists" },
      { id: "event_organizers", label: "Event organizers" },
      { id: "large_groups", label: "Large groups" },
    ],
    customer_needs: [
      { id: "quick_meal", label: "Quick meal" },
      { id: "dine_in_experience", label: "Dine-in experience" },
      { id: "takeaway", label: "Takeaway" },
      { id: "healthy_options", label: "Healthy options" },
      { id: "budget_friendly", label: "Budget friendly" },
      { id: "premium_quality", label: "Premium quality" },
      { id: "variety", label: "Menu variety" },
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
    pain_points: [
      { id: "long_wait", label: "Long wait times" },
      { id: "inconsistent_quality", label: "Inconsistent food quality" },
      { id: "high_prices", label: "High prices" },
      { id: "limited_menu", label: "Limited menu options" },
      { id: "poor_service", label: "Poor service" },
      { id: "hygiene", label: "Hygiene concerns" },
    ],
    differentiators: [
      { id: "authentic_recipes", label: "Authentic recipes" },
      { id: "fresh_ingredients", label: "Fresh ingredients" },
      { id: "family_recipe", label: "Family recipes" },
      { id: "local_source", label: "Locally sourced" },
      { id: "unique_dishes", label: "Unique dishes" },
      { id: "fast_service", label: "Fast service" },
    ],
    conversion_actions: [
      { id: "visit_restaurant", label: "Visit the restaurant" },
      { id: "order_online", label: "Order online" },
      { id: "reserve_table", label: "Reserve a table" },
      { id: "try_special", label: "Try a special dish" },
      { id: "follow_social", label: "Follow on social media" },
      { id: "refer_friend", label: "Refer a friend" },
    ],
    content_interests: [
      { id: "food_photos", label: "Food photos" },
      { id: "behind_scenes", label: "Behind the scenes" },
      { id: "customer_reviews", label: "Customer reviews" },
      { id: "specials", label: "Daily specials / Offers" },
      { id: "recipes", label: "Recipe tips" },
      { id: "events", label: "Events / Celebrations" },
    ],
    communication_preferences: [
      { id: "whatsapp", label: "WhatsApp" },
      { id: "instagram", label: "Instagram" },
      { id: "facebook", label: "Facebook" },
      { id: "google_reviews", label: "Google Reviews" },
      { id: "phone_call", label: "Phone calls" },
      { id: "walk_in", label: "Walk-in" },
    ],
  },
  salon: {
    customer_segments: [
      { id: "women", label: "Women" },
      { id: "men", label: "Men" },
      { id: "brides", label: "Brides-to-be" },
      { id: "young_adults", label: "Young adults" },
      { id: "professionals", label: "Professionals" },
      { id: "families", label: "Families" },
    ],
    customer_needs: [
      { id: "haircut", label: "Haircut & styling" },
      { id: "coloring", label: "Hair coloring" },
      { id: "bridal", label: "Bridal packages" },
      { id: "skin_care", label: "Skin care treatments" },
      { id: "affordable_grooming", label: "Affordable grooming" },
      { id: "premium_services", label: "Premium services" },
    ],
    buying_triggers: [
      { id: "special_occasion", label: "Special occasion" },
      { id: "regular_maintenance", label: "Regular maintenance" },
      { id: "new_look", label: "Want a new look" },
      { id: "referral", label: "Friend referral" },
      { id: "online_portfolio", label: "Portfolio / Before-after" },
      { id: "price_deals", label: "Price deals" },
    ],
    pain_points: [
      { id: "bad_experience", label: "Past bad experience" },
      { id: "inconsistent_results", label: "Inconsistent results" },
      { id: "overcharging", label: "Overcharging" },
      { id: "rude_staff", label: "Unfriendly staff" },
      { id: "waiting_time", label: "Long waiting" },
      { id: "product_safety", label: "Product safety concerns" },
    ],
    differentiators: [
      { id: "skilled_staff", label: "Skilled stylists" },
      { id: "premium_products", label: "Premium products" },
      { id: "hygiene", label: "Top hygiene standards" },
      { id: "affordable", label: "Affordable pricing" },
      { id: "custom_packages", label: "Customized packages" },
      { id: "convenient_location", label: "Convenient location" },
    ],
    conversion_actions: [
      { id: "book_appointment", label: "Book an appointment" },
      { id: "walk_in", label: "Walk in" },
      { id: "try_package", label: "Try a package" },
      { id: "follow_social", label: "Follow on Instagram" },
      { id: "refer_friend", label: "Refer a friend" },
    ],
    content_interests: [
      { id: "before_after", label: "Before & after" },
      { id: "styling_tips", label: "Styling tips" },
      { id: "new_styles", label: "Trending styles" },
      { id: "offers", label: "Offers & discounts" },
      { id: "client_testimonials", label: "Client testimonials" },
    ],
    communication_preferences: [
      { id: "whatsapp", label: "WhatsApp" },
      { id: "instagram", label: "Instagram" },
      { id: "phone_call", label: "Phone calls" },
      { id: "booking_app", label: "Booking app" },
    ],
  },
};

const DEFAULT_OPTIONS: Record<ProfilingStage, Array<{ id: string; label: string }>> = {
  customer_segments: [
    { id: "individual_consumers", label: "Individual consumers" },
    { id: "other_businesses", label: "Other businesses (B2B)" },
    { id: "both", label: "Both consumers & businesses" },
    { id: "government", label: "Government / Organizations" },
    { id: "specific_age", label: "Specific age group" },
    { id: "local_community", label: "Local community" },
  ],
  customer_needs: [
    { id: "quality", label: "Quality products / services" },
    { id: "affordability", label: "Affordable pricing" },
    { id: "convenience", label: "Convenience" },
    { id: "speed", label: "Fast delivery / service" },
    { id: "expertise", label: "Expert advice" },
    { id: "trust", label: "Trust & reliability" },
    { id: "variety", label: "Wide selection" },
  ],
  buying_triggers: [
    { id: "price", label: "Price / Deals" },
    { id: "quality", label: "Quality reputation" },
    { id: "reviews", label: "Online reviews" },
    { id: "recommendations", label: "Word of mouth" },
    { id: "convenience", label: "Convenience / Location" },
    { id: "urgency", label: "Urgent need" },
  ],
  pain_points: [
    { id: "high_prices", label: "High prices" },
    { id: "poor_quality", label: "Poor quality" },
    { id: "bad_service", label: "Bad customer service" },
    { id: "long_wait", label: "Long wait times" },
    { id: "limited_options", label: "Limited options" },
    { id: "trust_issues", label: "Trust / Reliability issues" },
  ],
  differentiators: [
    { id: "quality", label: "Superior quality" },
    { id: "price", label: "Competitive pricing" },
    { id: "experience", label: "Years of experience" },
    { id: "customer_service", label: "Excellent customer service" },
    { id: "local", label: "Local / Community focus" },
    { id: "unique_offer", label: "Unique product / service" },
  ],
  conversion_actions: [
    { id: "purchase", label: "Make a purchase" },
    { id: "contact", label: "Contact / Call us" },
    { id: "visit_store", label: "Visit our store" },
    { id: "book_service", label: "Book a service" },
    { id: "follow_social", label: "Follow on social media" },
    { id: "refer_friend", label: "Refer a friend" },
  ],
  content_interests: [
    { id: "product_photos", label: "Product / Service photos" },
    { id: "tips", label: "Tips & advice" },
    { id: "offers", label: "Offers & promotions" },
    { id: "testimonials", label: "Customer testimonials" },
    { id: "behind_scenes", label: "Behind the scenes" },
    { id: "educational", label: "Educational content" },
  ],
  communication_preferences: [
    { id: "whatsapp", label: "WhatsApp" },
    { id: "instagram", label: "Instagram" },
    { id: "facebook", label: "Facebook" },
    { id: "phone_call", label: "Phone calls" },
    { id: "email", label: "Email" },
    { id: "in_person", label: "In person" },
  ],
};

export interface KnownInfo {
  has_category: boolean;
  has_location: boolean;
  has_description: boolean;
  has_products: boolean;
  has_goals: boolean;
  has_brand_tone: boolean;
  has_personas: boolean;
  category: string | null;
  existing_segments: string[];
  existing_needs: string[];
}

export function analyzeExistingKnowledge(brain: BusinessBrainContext): KnownInfo {
  return {
    has_category: !!brain.business.category,
    has_location: !!(brain.business.city || brain.business.region),
    has_description: !!brain.business.description && brain.business.description.length > 20,
    has_products: brain.products.length > 0 || brain.services.length > 0,
    has_goals: brain.goals.length > 0,
    has_brand_tone: !!brain.brand?.tone,
    has_personas: brain.personas.length > 0,
    category: brain.business.category,
    existing_segments: brain.personas.map(p => p.name),
    existing_needs: brain.personas.filter(p => p.needs).map(p => p.needs!),
  };
}

export function identifyMissingStages(known: KnownInfo): ProfilingStage[] {
  const stages: ProfilingStage[] = [];

  if (known.existing_segments.length === 0) {
    stages.push("customer_segments");
  }

  if (known.existing_needs.length === 0) {
    stages.push("customer_needs");
  }

  stages.push("buying_triggers");
  stages.push("pain_points");
  stages.push("differentiators");

  if (!known.has_goals) {
    stages.push("conversion_actions");
  }

  stages.push("content_interests");
  stages.push("communication_preferences");

  return stages;
}

function getOptionsForStage(category: string | null, stage: ProfilingStage): Array<{ id: string; label: string }> {
  if (category) {
    const normalizedCategory = category.toLowerCase().trim();
    for (const [key, options] of Object.entries(CATEGORY_OPTIONS)) {
      if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
        return options[stage] || DEFAULT_OPTIONS[stage];
      }
    }
  }
  return DEFAULT_OPTIONS[stage];
}

const SCREEN_TITLES: Record<ProfilingStage, { title: string; description: string; questionTitle: string }> = {
  customer_segments: {
    title: "Who are your customers?",
    description: "Select all the customer groups your business serves.",
    questionTitle: "Who are your main customers?",
  },
  customer_needs: {
    title: "What do your customers care about?",
    description: "Select the things that matter most to your customers.",
    questionTitle: "What do your customers value most?",
  },
  buying_triggers: {
    title: "Why do customers choose you?",
    description: "Select the main reasons customers pick your business.",
    questionTitle: "What makes customers choose you?",
  },
  pain_points: {
    title: "What frustrates your customers?",
    description: "Select the problems your customers face with businesses like yours.",
    questionTitle: "What problems do your customers face?",
  },
  differentiators: {
    title: "What makes you different?",
    description: "Select what sets your business apart from competitors.",
    questionTitle: "What makes your business stand out?",
  },
  conversion_actions: {
    title: "What should customers do?",
    description: "Select the actions you want customers to take.",
    questionTitle: "What do you want customers to do next?",
  },
  content_interests: {
    title: "What content engages your customers?",
    description: "Select the types of content your customers enjoy.",
    questionTitle: "What content do your customers engage with?",
  },
  communication_preferences: {
    title: "How do customers reach you?",
    description: "Select the channels your customers prefer.",
    questionTitle: "How do your customers prefer to connect?",
  },
};

export function generateProfilingScreens(brain: BusinessBrainContext): ProfilingScreen[] {
  const known = analyzeExistingKnowledge(brain);
  const missingStages = identifyMissingStages(known);

  if (missingStages.length === 0) {
    return [
      {
        id: "review",
        title: "Review your profile",
        description: "Your business profile looks complete. Let's review and generate personas.",
        questions: [],
      },
    ];
  }

  const screens: ProfilingScreen[] = [];

  for (let i = 0; i < missingStages.length; i++) {
    const stage = missingStages[i];
    const meta = SCREEN_TITLES[stage];
    const rawOptions = getOptionsForStage(known.category, stage);

    const options = rawOptions.map(opt => ({
      id: opt.id,
      label: opt.label,
    }));

    const isLast = i === missingStages.length - 1;

    const question: ProfilingQuestion = {
      id: stage,
      title: meta.questionTitle,
      description: meta.description,
      stage,
      selection_mode: stage === "communication_preferences" ? "multiple" : stage === "conversion_actions" ? "single" : "multiple",
      options,
      allow_other: true,
      allow_none: true,
      required: false,
    };

    screens.push({
      id: `screen_${i}`,
      title: meta.title,
      description: meta.description,
      questions: [question],
    });
  }

  screens.push({
    id: "review",
    title: "Review your profile",
    description: "Here's what we learned about your customers. You can edit before we generate personas.",
    questions: [],
  });

  return screens;
}
