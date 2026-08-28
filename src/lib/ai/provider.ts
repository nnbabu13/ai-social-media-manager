import { z } from "zod";
import { interviewQuestionSchema, type InterviewQuestionOutput } from "@/lib/validators/business-brain";
import { personaReviewSchema, type PersonaReviewOutput } from "@/lib/validators/business-profiling";

export type InterviewQuestion = InterviewQuestionOutput;

export interface AIProvider {
  generateInterviewQuestion(context: InterviewContext): Promise<InterviewQuestion>;
  extractBusinessKnowledge(messages: AIMessage[]): Promise<BusinessKnowledgeExtraction>;
  generateBusinessSummary(context: string): Promise<string>;
  generateSuggestedFAQ(customerQuestion: string, businessContext: string): Promise<{ question: string; answer: string }>;
  generatePersonas(profilingData: ProfilingData, businessContext: string): Promise<PersonaReviewOutput>;
  generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string>;
}

export interface ProfilingData {
  customer_segments: string[];
  customer_needs: string[];
  buying_triggers: string[];
  pain_points: string[];
  differentiators: string[];
  conversion_actions: string[];
  content_interests: string[];
  communication_preferences: string[];
  custom_inputs: string[];
}

export interface AIMessage {
  role: "system" | "assistant" | "user";
  content: string;
}

export interface InterviewContext {
  businessName: string;
  category: string | null;
  currentStage: string;
  previousAnswers: Record<string, string>;
  extractedKnowledge: Record<string, unknown>;
  lastUserMessage?: string;
  existingKnowledge?: string;
}

export interface BusinessKnowledgeExtraction {
  businessFacts: Array<{ category: string; title: string; content: string; confidence: number }>;
  products: Array<{ name: string; description: string; confidence: number }>;
  services: Array<{ name: string; description: string; confidence: number }>;
  faqs: Array<{ question: string; answer: string; confidence: number }>;
  locations: Array<{ name: string; city: string; service_area: string; confidence: number }>;
  customerPersonas: Array<{ name: string; description: string; pain_points: string; needs: string; confidence: number }>;
  brandObservations: Array<{ observation: string; confidence: number }>;
  policies: Array<{ description: string; confidence: number }>;
}

const KnowledgeExtractionSchema = z.object({
  businessFacts: z.array(z.object({
    category: z.string(),
    title: z.string(),
    content: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  products: z.array(z.object({
    name: z.string(),
    description: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  services: z.array(z.object({
    name: z.string(),
    description: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  locations: z.array(z.object({
    name: z.string(),
    city: z.string(),
    service_area: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  customerPersonas: z.array(z.object({
    name: z.string(),
    description: z.string(),
    pain_points: z.string(),
    needs: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  brandObservations: z.array(z.object({
    observation: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  policies: z.array(z.object({
    description: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

const NEMOTRON_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NEMOTRON_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";

const FALLBACK_QUESTIONS: Record<string, InterviewQuestion> = {
  business: {
    question: "What type of business do you run?",
    stage: "business",
    is_complete: false,
    expects_text: false,
    suggested_answers: [
      "Restaurant / Cafe / Food",
      "Retail / Shop / Store",
      "Service business (plumbing, cleaning, etc.)",
      "Professional services (consulting, accounting, etc.)",
      "Health & Wellness (gym, salon, clinic)",
      "Other",
    ],
  },
  products_services: {
    question: "What do you sell or provide?",
    stage: "products_services",
    is_complete: false,
    expects_text: false,
    suggested_answers: [
      "Physical products (goods, items, merchandise)",
      "Food & Beverages",
      "Services (repairs, maintenance, cleaning)",
      "Professional consulting / Advisory",
      "Digital products / Online services",
      "Other",
    ],
  },
  customers: {
    question: "Who are your main customers?",
    stage: "customers",
    is_complete: false,
    expects_text: false,
    suggested_answers: [
      "Individual consumers / Households",
      "Other businesses (B2B)",
      "Both consumers and businesses",
      "Government / Organizations",
      "Specific age group (e.g., young adults, seniors)",
      "Other",
    ],
  },
  brand: {
    question: "How should your business sound online?",
    stage: "brand",
    is_complete: false,
    expects_text: false,
    suggested_answers: [
      "Friendly & Casual",
      "Professional & Formal",
      "Fun & Playful",
      "Expert & Authoritative",
      "Warm & Personal",
      "Other",
    ],
  },
  policies: {
    question: "How do customers typically buy from you?",
    stage: "policies",
    is_complete: false,
    expects_text: false,
    suggested_answers: [
      "Fixed prices shown in store / online",
      "Quote-based / Custom pricing",
      "Subscription / Recurring",
      "Negotiable / Depends on the job",
      "Free consultation first",
      "Other",
    ],
  },
  goals: {
    question: "What do you want most from social media?",
    stage: "goals",
    is_complete: true,
    expects_text: false,
    suggested_answers: [
      "Get more customers / Leads",
      "Build brand awareness",
      "Engage with existing customers",
      "Promote offers & events",
      "Sell products directly online",
      "Other",
    ],
  },
};

function getFallbackQuestion(stage: string): InterviewQuestion {
  return FALLBACK_QUESTIONS[stage] || FALLBACK_QUESTIONS.business;
}

const FIRST_QUESTION: InterviewQuestion = {
  question: "What type of business do you run?",
  stage: "business",
  is_complete: false,
  expects_text: false,
  suggested_answers: [
    "Restaurant / Cafe / Food",
    "Retail / Shop / Store",
    "Service business (plumbing, cleaning, etc.)",
    "Professional services (consulting, accounting, etc.)",
    "Health & Wellness (gym, salon, clinic)",
    "Other",
  ],
};

export function createAIProvider(): AIProvider {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    console.warn("NVIDIA_API_KEY not set. Using mock AI provider.");
    return new MockAIProvider();
  }

  return new NemotronProvider(apiKey);
}

class MockAIProvider implements AIProvider {
  async generateInterviewQuestion(context: InterviewContext): Promise<InterviewQuestion> {
    const stageQuestions: Record<string, string[]> = {
      business: [
        "What does your business do?",
        "Where is your business located?",
        "What areas do you serve?",
      ],
      products_services: [
        "What products or services do you offer?",
        "Which product or service is most popular?",
        "What makes your product or service different?",
      ],
      customers: [
        "Who are your typical customers?",
        "What problems are they trying to solve?",
        "What questions do customers usually ask before buying?",
      ],
      brand: [
        "How should your business sound when communicating with customers?",
        "Is there anything your AI manager must never say or do?",
      ],
      policies: [
        "Do you publish your prices, or do customers usually ask for a quote?",
        "Do you deliver or provide services outside your main location?",
      ],
      goals: [
        "What's the most important thing you want social media to achieve?",
      ],
    };

    const questions = stageQuestions[context.currentStage] || stageQuestions.business;
    const questionIndex = Object.keys(context.previousAnswers).length % questions.length;

    return {
      question: questions[questionIndex],
      stage: context.currentStage as InterviewQuestion["stage"],
      is_complete: false,
      expects_text: true,
      suggested_answers: [],
    };
  }

  async extractBusinessKnowledge(messages: AIMessage[]): Promise<BusinessKnowledgeExtraction> {
    const userMessages = messages.filter(m => m.role === "user" && m.content !== "[Skipped]").map(m => m.content);
    const allText = userMessages.join(" ");

    const products: BusinessKnowledgeExtraction["products"] = [];
    const services: BusinessKnowledgeExtraction["services"] = [];
    const facts: BusinessKnowledgeExtraction["businessFacts"] = [];
    const faqs: BusinessKnowledgeExtraction["faqs"] = [];
    const locations: BusinessKnowledgeExtraction["locations"] = [];

    const productKeywords = ["sell", "product", "offer", "provide", "bottle", "item"];
    const serviceKeywords = ["service", "do", "help", "consult", "repair", "deliver"];

    if (productKeywords.some(k => allText.toLowerCase().includes(k))) {
      const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 10);
      for (const sentence of sentences.slice(0, 3)) {
        if (productKeywords.some(k => sentence.toLowerCase().includes(k))) {
          products.push({
            name: sentence.trim().slice(0, 80),
            description: sentence.trim(),
            confidence: 0.6,
          });
        }
      }
    }

    if (serviceKeywords.some(k => allText.toLowerCase().includes(k))) {
      const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 10);
      for (const sentence of sentences.slice(0, 3)) {
        if (serviceKeywords.some(k => sentence.toLowerCase().includes(k))) {
          services.push({
            name: sentence.trim().slice(0, 80),
            description: sentence.trim(),
            confidence: 0.6,
          });
        }
      }
    }

    const locationPatterns = allText.match(/(?:in|from|at|near|around|serving)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
    if (locationPatterns) {
      for (const match of locationPatterns.slice(0, 3)) {
        const cityName = match.replace(/^(?:in|from|at|near|around|serving)\s+/, "").trim();
        locations.push({
          name: cityName,
          city: cityName,
          service_area: cityName,
          confidence: 0.7,
        });
      }
    }

    return {
      businessFacts: facts,
      products,
      services,
      faqs,
      locations,
      customerPersonas: [],
      brandObservations: [],
      policies: [],
    };
  }

  async generateBusinessSummary(context: string): Promise<string> {
    return `Based on the provided information, this business operates in the described area and serves its target customers. The business has shared information about its products, services, and goals. Continue building the Business Brain by adding more details.`;
  }

  async generateSuggestedFAQ(customerQuestion: string, businessContext: string): Promise<{ question: string; answer: string }> {
    return {
      question: customerQuestion,
      answer: `Based on the business information: ${businessContext.slice(0, 200)}`,
    };
  }

  async generatePersonas(profilingData: ProfilingData, businessContext: string): Promise<PersonaReviewOutput> {
    const primaryPersona = {
      name: "Primary Customer",
      description: `Customers interested in this business, primarily selected as: ${profilingData.customer_segments.join(", ") || "general audience"}.`,
      segments: profilingData.customer_segments,
      needs: profilingData.customer_needs,
      pain_points: profilingData.pain_points,
      buying_triggers: profilingData.buying_triggers,
      objections: [],
      content_interests: profilingData.content_interests,
      preferred_channels: profilingData.communication_preferences,
      priority: "primary" as const,
      confidence: 0.7,
      source: "ai_derived" as const,
    };

    const insights: string[] = [];
    if (profilingData.pain_points.length > 0) {
      insights.push(`Customers care most about: ${profilingData.pain_points.slice(0, 3).join(", ")}.`);
    }
    if (profilingData.buying_triggers.length > 0) {
      insights.push(`Main reasons customers choose this business: ${profilingData.buying_triggers.slice(0, 3).join(", ")}.`);
    }

    return {
      personas: [primaryPersona],
      derived_insights: insights,
    };
  }

  async generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    return `Mock AI response to: ${prompt.slice(0, 100)}...`;
  }
}

class NemotronProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async chatRaw(messages: AIMessage[], options: { max_tokens?: number; temperature?: number; reasoning_budget?: number } = {}): Promise<string> {
    try {
      const response = await fetch(`${NEMOTRON_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: NEMOTRON_MODEL,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          max_tokens: options.max_tokens || 1024,
          temperature: options.temperature ?? 0.7,
          extra_body: {
            chat_template_kwargs: { enable_thinking: true },
            reasoning_budget: options.reasoning_budget || 1024,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("[AI] API error:", response.status, error);
        return "";
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      return content;
    } catch (error) {
      console.error("[AI] API call failed:", error);
      return "";
    }
  }

  async generateInterviewQuestion(context: InterviewContext): Promise<InterviewQuestion> {
    if (Object.keys(context.previousAnswers).length === 0 && !context.lastUserMessage) {
      return FIRST_QUESTION;
    }

    const historyText = Object.entries(context.previousAnswers)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join("\n");

    const systemPrompt = `You are a business profile builder. Your job is to quickly understand a business by asking short, focused questions with multiple-choice options.

BUSINESS CONTEXT:
Name: ${context.businessName || "Not yet provided"}
Category: ${context.category || "Not specified"}
Stage: ${context.currentStage}
${context.existingKnowledge ? `\nKnown info:\n${context.existingKnowledge}` : ""}

PREVIOUS ANSWERS:
${historyText || "None yet."}

RULES:
1. Generate ONE question at a time with 4-6 short selectable options.
2. Do NOT repeat questions already answered.
3. Options should be specific to the business type and category when possible.
4. Include an "Other" option at the end for custom answers.
5. Keep options short (2-5 words each).
6. If this is the LAST question for this stage, set is_complete to true.

OUTPUT: Return ONLY valid JSON. No other text.

{
  "question": "Short question text",
  "stage": "${context.currentStage}",
  "is_complete": false,
  "expects_text": false,
  "suggested_answers": ["Option 1", "Option 2", "Option 3", "Option 4", "Other"]
}`;

    const messages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: context.lastUserMessage || "Generate the first question." },
    ];

    const content = await this.chatRaw(messages, { max_tokens: 500, temperature: 0.7, reasoning_budget: 512 });

    const parsed = this.parseInterviewQuestion(content, context.currentStage);
    return parsed;
  }

  private parseInterviewQuestion(content: string, currentStage: string): InterviewQuestion {
    // Try to extract JSON from the response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const validated = interviewQuestionSchema.safeParse(parsed);
        if (validated.success) {
          console.log("[AI] Interview question parsed successfully");
          return validated.data;
        }
        console.warn("[AI] Zod validation failed:", validated.error.flatten());
      }
    } catch (e) {
      console.warn("[AI] JSON parse failed:", e);
    }

    // Retry once with a stricter prompt
    console.log("[AI] Retrying with raw content fallback...");
    const retryResult = this.extractQuestionFromText(content, currentStage);
    if (retryResult) {
      console.log("[AI] Recovered question from text");
      return retryResult;
    }

    // Use fallback
    console.log("[AI] Using fallback question for stage:", currentStage);
    return getFallbackQuestion(currentStage);
  }

  private extractQuestionFromText(content: string, currentStage: string): InterviewQuestion | null {
    // Try to find a question mark sentence
    const questionMatch = content.match(/([^.!]*\?\s*)/);
    if (questionMatch) {
      const question = questionMatch[1].trim();
      if (question.length > 10 && question.length < 300) {
        return {
          question,
          stage: currentStage as InterviewQuestion["stage"],
          is_complete: false,
          expects_text: true,
          suggested_answers: [],
        };
      }
    }
    return null;
  }

  async extractBusinessKnowledge(messages: AIMessage[]): Promise<BusinessKnowledgeExtraction> {
    const conversation = messages
      .filter(m => m.content !== "[Skipped]")
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    const systemPrompt = `You are a business knowledge extractor. Analyze the conversation and extract structured information about the business.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "businessFacts": [{"category": "general|pricing|delivery|location|opening_hours|products|services|policies|customer_service|brand|other", "title": "short fact title", "content": "fact detail", "confidence": 0.0-1.0}],
  "products": [{"name": "product name", "description": "product description", "confidence": 0.0-1.0}],
  "services": [{"name": "service name", "description": "service description", "confidence": 0.0-1.0}],
  "faqs": [{"question": "customer question", "answer": "answer", "confidence": 0.0-1.0}],
  "locations": [{"name": "location name", "city": "city", "service_area": "service area", "confidence": 0.0-1.0}],
  "customerPersonas": [{"name": "persona name", "description": "description", "pain_points": "pain points", "needs": "needs", "confidence": 0.0-1.0}],
  "brandObservations": [{"observation": "brand observation", "confidence": 0.0-1.0}],
  "policies": [{"description": "policy description", "confidence": 0.0-1.0}]
}

Confidence guide:
- 0.9-1.0: Owner explicitly stated this
- 0.7-0.8: Strongly implied by conversation
- 0.5-0.6: Inferred from context
- Below 0.5: Do not include

Only include information explicitly stated or strongly implied by the business owner.`;

    const content = await this.chatRaw(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: conversation },
      ],
      { max_tokens: 2048, temperature: 0.3, reasoning_budget: 4096 }
    );

    if (!content) return this.getEmptyExtraction();

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return this.getEmptyExtraction();

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = KnowledgeExtractionSchema.safeParse(parsed);
      return validated.success ? validated.data : this.getEmptyExtraction();
    } catch {
      return this.getEmptyExtraction();
    }
  }

  async generateBusinessSummary(context: string): Promise<string> {
    const content = await this.chatRaw(
      [
        {
          role: "system",
          content: "Generate a friendly 2-3 sentence business summary based on the provided information. Be concise and factual. Do not use markdown.",
        },
        { role: "user", content: context },
      ],
      { max_tokens: 150, temperature: 0.5 }
    );

    return content || "Business summary unavailable.";
  }

  async generateSuggestedFAQ(customerQuestion: string, businessContext: string): Promise<{ question: string; answer: string }> {
    const content = await this.chatRaw(
      [
        {
          role: "system",
          content: `Based on this business context, generate a helpful FAQ answer for the customer's question. Return ONLY valid JSON: {"question": "the question", "answer": "helpful answer"}`,
        },
        { role: "user", content: `Business context:\n${businessContext}\n\nCustomer question: ${customerQuestion}` },
      ],
      { max_tokens: 200, temperature: 0.5 }
    );

    if (!content) return { question: customerQuestion, answer: "Please contact us for this information." };

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { question: customerQuestion, answer: "Please contact us for this information." };

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        question: parsed.question || customerQuestion,
        answer: parsed.answer || "Please contact us for this information.",
      };
    } catch {
      return { question: customerQuestion, answer: "Please contact us for this information." };
    }
  }

  async generatePersonas(profilingData: ProfilingData, businessContext: string): Promise<PersonaReviewOutput> {
    const profilingSummary = [
      profilingData.customer_segments.length ? `Customer segments: ${profilingData.customer_segments.join(", ")}` : "",
      profilingData.customer_needs.length ? `Customer needs: ${profilingData.customer_needs.join(", ")}` : "",
      profilingData.buying_triggers.length ? `Buying triggers: ${profilingData.buying_triggers.join(", ")}` : "",
      profilingData.pain_points.length ? `Pain points: ${profilingData.pain_points.join(", ")}` : "",
      profilingData.differentiators.length ? `Differentiators: ${profilingData.differentiators.join(", ")}` : "",
      profilingData.conversion_actions.length ? `Conversion actions: ${profilingData.conversion_actions.join(", ")}` : "",
      profilingData.content_interests.length ? `Content interests: ${profilingData.content_interests.join(", ")}` : "",
      profilingData.communication_preferences.length ? `Communication preferences: ${profilingData.communication_preferences.join(", ")}` : "",
      profilingData.custom_inputs.length ? `Custom inputs from owner: ${profilingData.custom_inputs.join("; ")}` : "",
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are a customer persona generator for a small business.

BUSINESS CONTEXT:
${businessContext || "No additional business context."}

CUSTOMER PROFILING DATA:
${profilingSummary}

Based on the profiling data, generate 1-3 customer personas.

RULES:
1. Use ONLY the confirmed business information and user-selected profile options.
2. Do NOT invent demographics (age, income, gender) unless explicitly stated.
3. Clearly distinguish AI-derived insights from confirmed facts.
4. Each persona must be useful for social media content creation.
5. Set priority: "primary" for the largest segment, "secondary" for smaller groups, "occasional" for niche.
6. Confidence reflects how well the data supports the persona (0.5-1.0).
7. Do NOT output reasoning. Return only structured JSON.

Return ONLY valid JSON matching this schema:
{
  "personas": [
    {
      "name": "Short persona name",
      "description": "1-2 sentence description",
      "segments": ["selected customer segments this persona represents"],
      "needs": ["customer needs this persona has"],
      "pain_points": ["problems this persona faces"],
      "buying_triggers": ["what makes this persona buy"],
      "objections": ["common objections from this persona"],
      "content_interests": ["content types this persona engages with"],
      "preferred_channels": ["channels this persona uses"],
      "priority": "primary|secondary|occasional",
      "confidence": 0.7,
      "source": "ai_derived"
    }
  ],
  "derived_insights": [
    "One useful insight derived from the profiling data"
  ]
}`;

    const content = await this.chatRaw(
      [{ role: "system", content: systemPrompt }],
      { max_tokens: 1500, temperature: 0.5, reasoning_budget: 1024 }
    );

    if (!content) return this.getEmptyPersonas(profilingData);

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return this.getEmptyPersonas(profilingData);

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = personaReviewSchema.safeParse(parsed);
      if (validated.success) {
        console.log("[AI] Personas generated successfully");
        return validated.data;
      }
      console.warn("[AI] Persona validation failed:", validated.error.flatten());
    } catch (e) {
      console.warn("[AI] Persona JSON parse failed:", e);
    }

    return this.getEmptyPersonas(profilingData);
  }

  async generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    return this.chatRaw(
      [{ role: "user", content: prompt }],
      {
        max_tokens: options?.maxTokens ?? 2000,
        temperature: options?.temperature ?? 0.3,
        reasoning_budget: 1024,
      }
    );
  }

  private getEmptyPersonas(profilingData: ProfilingData): PersonaReviewOutput {
    return {
      personas: [{
        name: "Primary Customer",
        description: `Customers interested in this business.`,
        segments: profilingData.customer_segments,
        needs: profilingData.customer_needs,
        pain_points: profilingData.pain_points,
        buying_triggers: profilingData.buying_triggers,
        objections: [],
        content_interests: profilingData.content_interests,
        preferred_channels: profilingData.communication_preferences,
        priority: "primary",
        confidence: 0.6,
        source: "ai_derived",
      }],
      derived_insights: [],
    };
  }

  private getEmptyExtraction(): BusinessKnowledgeExtraction {
    return {
      businessFacts: [],
      products: [],
      services: [],
      faqs: [],
      locations: [],
      customerPersonas: [],
      brandObservations: [],
      policies: [],
    };
  }
}
