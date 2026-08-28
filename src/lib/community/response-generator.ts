import { createClient } from "@/lib/supabase/server";
import type { ConversationClassification, CustomerContext } from "@/types/community";

export interface ResponseContext {
  businessBrain: any;
  conversation: any;
  messages: any[];
  classification: ConversationClassification;
  customerContext?: CustomerContext;
  platform: string;
}

export interface GeneratedResponse {
  text: string;
  confidence: number;
  factualBasis: string[];
  warnings: string[];
  blocked: boolean;
  blockReason?: string;
}

const BLOCKED_PATTERNS = [
  /government\s+certified/i,
  /fda\s+approved/i,
  /legally\s+guaranteed/i,
  /100%\s+effective/i,
  /no\s+side\s+effects/i,
  /miracle\s+cure/i,
  /medical\s+advice/i,
  /legal\s+advice/i,
];

export async function generateCommunityResponse(
  context: ResponseContext
): Promise<GeneratedResponse> {
  const { businessBrain, classification, messages, platform } = context;
  const warnings: string[] = [];
  const factualBasis: string[] = [];

  const lastCustomerMessage = [...messages]
    .reverse()
    .find(m => m.direction === "inbound");

  if (!lastCustomerMessage?.text) {
    return {
      text: "",
      confidence: 0,
      factualBasis: [],
      warnings: ["No customer message to respond to"],
      blocked: true,
      blockReason: "No customer message found",
    };
  }

  const customerText = lastCustomerMessage.text;

  if (BLOCKED_PATTERNS.some(p => p.test(customerText))) {
    return {
      text: "",
      confidence: 0,
      factualBasis: [],
      warnings: ["Contains sensitive topic requiring human review"],
      blocked: true,
      blockReason: "Sensitive topic detected — requires human review",
    };
  }

  const faqs = businessBrain?.faqs || [];
  const matchedFaq = faqs.find((faq: any) => {
    const question = (faq.question || "").toLowerCase();
    const keywords = customerText.toLowerCase().split(/\s+/);
    return keywords.some((k: string) => k.length > 3 && question.includes(k));
  });

  if (matchedFaq && classification.intent.includes("question")) {
    factualBasis.push(`FAQ: ${matchedFaq.question}`);
    return {
      text: matchedFaq.answer,
      confidence: 0.85,
      factualBasis,
      warnings,
      blocked: false,
    };
  }

  const products = businessBrain?.products || [];
  const matchedProduct = products.find((p: any) => {
    const name = (p.name || "").toLowerCase();
    return customerText.toLowerCase().includes(name);
  });

  if (matchedProduct && classification.intent === "pricing_question") {
    if (matchedProduct.price) {
      factualBasis.push(`Product: ${matchedProduct.name} — ₹${matchedProduct.price}`);
      return {
        text: `${matchedProduct.name} is priced at ₹${matchedProduct.price}. Would you like to know more about customization options?`,
        confidence: 0.8,
        factualBasis,
        warnings,
        blocked: false,
      };
    }
    warnings.push("Product found but no price confirmed in Business Brain");
    return {
      text: "I can help you with pricing. Let me connect you with our team for the best quote.",
      confidence: 0.5,
      factualBasis,
      warnings,
      blocked: false,
    };
  }

  if (classification.intent === "positive_feedback") {
    return {
      text: "Thank you! We're glad you had a great experience.",
      confidence: 0.9,
      factualBasis: ["Standard positive feedback response"],
      warnings: [],
      blocked: false,
    };
  }

  if (classification.intent === "complaint") {
    return {
      text: "",
      confidence: 0,
      factualBasis: [],
      warnings: ["Complaint requires human review"],
      blocked: true,
      blockReason: "Customer complaint — requires personal response",
    };
  }

  if (classification.riskLevel === "high" || classification.riskLevel === "critical") {
    return {
      text: "",
      confidence: 0,
      factualBasis: [],
      warnings: ["High-risk conversation requires human handling"],
      blocked: true,
      blockReason: "High-risk conversation — requires human attention",
    };
  }

  const businessName = businessBrain?.business?.name || "our business";
  return {
    text: `Thank you for reaching out to ${businessName}! I'd be happy to help. Could you tell me more about what you're looking for?`,
    confidence: 0.4,
    factualBasis: ["Generic engagement response"],
    warnings: [...warnings, "Low-confidence response — approval recommended"],
    blocked: false,
  };
}

export function reviewCommunityResponse(
  response: string,
  businessBrain: any,
  context: ResponseContext
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!response || response.trim().length === 0) {
    issues.push("Response is empty");
    return { valid: false, issues };
  }

  if (response.length > 2000) {
    issues.push("Response exceeds platform character limit");
  }

  if (BLOCKED_PATTERNS.some(p => p.test(response))) {
    issues.push("Response contains unsupported claims");
  }

  const facts = businessBrain?.facts || [];
  const priceMatch = response.match(/₹\d+/);
  if (priceMatch) {
    const mentionedPrice = priceMatch[0];
    const priceInFacts = facts.some((f: any) =>
      (f.content || "").includes(mentionedPrice)
    );
    if (!priceInFacts) {
      issues.push("Price mentioned not confirmed in Business Brain");
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
