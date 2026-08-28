"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react";
import { getDomainDisplayName } from "@/lib/business-brain/domains";
import type { BrainDomain, OptionalDomain, FutureDomain } from "@/types/brain-readiness";
import {
  updateBusiness,
  addFaq,
  addGoal,
  addService,
  addFact,
  updateBrandTone,
} from "@/app/actions/knowledge";

interface DomainFixItProps {
  domain: BrainDomain | OptionalDomain | FutureDomain;
  missing: string[];
  businessId: string;
  onComplete?: () => void;
}

interface Question {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
}

function getQuestionsForDomain(domain: BrainDomain | OptionalDomain | FutureDomain, missing: string[]): Question[] {
  const questions: Question[] = [];

  switch (domain) {
    case "identity":
      if (missing.some(m => m.includes("description"))) {
        questions.push({
          id: "description",
          label: "Describe what your business does in 1-2 sentences",
          type: "textarea",
          placeholder: "e.g. We provide premium bottled water for events and offices in Kakinada...",
        });
      }
      if (missing.some(m => m.includes("category"))) {
        questions.push({
          id: "category",
          label: "What industry are you in?",
          type: "select",
          options: [
            "Food & Beverage",
            "Health & Wellness",
            "Professional Services",
            "Retail",
            "Technology",
            "Education",
            "Real Estate",
            "Hospitality",
            "Manufacturing",
            "Other",
          ],
        });
      }
      break;

    case "offerings":
      questions.push({
        id: "product_name",
        label: "Add a product or service",
        type: "text",
        placeholder: "e.g. Premium Water Bottle, Bookkeeping Service",
      });
      questions.push({
        id: "product_description",
        label: "Brief description",
        type: "textarea",
        placeholder: "What does it do? Who is it for?",
      });
      break;

    case "audience":
      questions.push({
        id: "target_customers",
        label: "Who are your ideal customers?",
        type: "textarea",
        placeholder: "e.g. Wedding planners, corporate offices, event organizers",
      });
      break;

    case "customer_needs":
      questions.push({
        id: "needs",
        label: "What problem do you solve for your customers?",
        type: "textarea",
        placeholder: "e.g. They need reliable, affordable water supply for events",
      });
      break;

    case "customer_questions":
      questions.push({
        id: "faq_question",
        label: "What question do customers often ask?",
        type: "text",
        placeholder: "e.g. What is the minimum order quantity?",
      });
      questions.push({
        id: "faq_answer",
        label: "Your answer",
        type: "textarea",
        placeholder: "e.g. We accept orders starting from 10 bottles",
      });
      break;

    case "customer_journey":
      questions.push({
        id: "journey",
        label: "How do customers typically find and buy from you?",
        type: "textarea",
        placeholder: "e.g. They call us, visit our shop, or message on WhatsApp",
      });
      break;

    case "brand":
      questions.push({
        id: "tone",
        label: "How should your business sound?",
        type: "select",
        options: [
          "Professional",
          "Friendly",
          "Casual",
          "Luxurious",
          "Playful",
          "Authoritative",
          "Warm",
          "Technical",
        ],
      });
      questions.push({
        id: "style_description",
        label: "Any specific writing style notes?",
        type: "textarea",
        placeholder: "e.g. Keep it simple, use short sentences, avoid jargon",
      });
      break;

    case "positioning":
      questions.push({
        id: "differentiator",
        label: "What makes you different from competitors?",
        type: "textarea",
        placeholder: "e.g. We deliver same-day, offer bulk discounts, use eco-friendly packaging",
      });
      break;

    case "conversion":
      questions.push({
        id: "conversion_action",
        label: "What should customers do next?",
        type: "select",
        options: [
          "Call us",
          "Send a WhatsApp message",
          "Visit our website",
          "Visit our shop",
          "Send an email",
          "Book an appointment",
          "Fill out a form",
        ],
      });
      break;

    case "policies":
      questions.push({
        id: "policy",
        label: "Any key business policies customers should know?",
        type: "textarea",
        placeholder: "e.g. Free delivery for orders over $50, 30-day returns",
      });
      break;

    case "ai_rules":
      questions.push({
        id: "autonomy_level",
        label: "How much freedom should the AI have?",
        type: "select",
        options: [
          "Assistant - always ask before posting",
          "Manager - can post simple content, asks for important stuff",
        ],
      });
      break;

    case "content_strategy":
      questions.push({
        id: "content_topics",
        label: "What topics should your AI post about?",
        type: "textarea",
        placeholder: "e.g. Product highlights, customer stories, industry tips",
      });
      break;

    case "goals":
      questions.push({
        id: "primary_goal",
        label: "What is your main business goal?",
        type: "select",
        options: [
          "Get more customers",
          "Build brand awareness",
          "Increase sales",
          "Improve customer loyalty",
          "Generate leads",
          "Establish expertise",
        ],
      });
      questions.push({
        id: "secondary_goal",
        label: "Any other goals?",
        type: "textarea",
        placeholder: "Optional: e.g. Expand to new areas, launch new product",
      });
      break;
  }

  return questions;
}

export function DomainFixIt({ domain, missing, businessId, onComplete }: DomainFixItProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = getQuestionsForDomain(domain, missing);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let result;

      switch (domain) {
        case "identity":
          result = await updateBusiness(businessId, {
            description: answers.description,
            category: answers.category,
          });
          break;

        case "offerings":
          if (answers.product_name) {
            result = await addService(businessId, {
              name: answers.product_name,
              description: answers.product_description,
            });
          }
          break;

        case "audience":
          result = await updateBusiness(businessId, {
            target_customers: answers.target_customers,
          });
          break;

        case "customer_needs":
          result = await addFact(businessId, {
            category: "customer_needs",
            title: "Customer problem",
            content: answers.needs || "",
          });
          break;

        case "customer_questions":
          if (answers.faq_question && answers.faq_answer) {
            result = await addFaq(businessId, {
              question: answers.faq_question,
              answer: answers.faq_answer,
              category: "general",
            });
          }
          break;

        case "customer_journey":
          result = await addFact(businessId, {
            category: "customer_journey",
            title: "Customer journey",
            content: answers.journey || "",
          });
          break;

        case "brand":
          result = await updateBrandTone(businessId, {
            tone: answers.tone,
            style_description: answers.style_description,
          });
          break;

        case "positioning":
          result = await addFact(businessId, {
            category: "differentiation",
            title: "Differentiator",
            content: answers.differentiator || "",
          });
          break;

        case "conversion":
          result = await addFact(businessId, {
            category: "conversion",
            title: "Conversion action",
            content: answers.conversion_action || "",
          });
          break;

        case "policies":
          result = await addFact(businessId, {
            category: "policies",
            title: "Business policy",
            content: answers.policy || "",
          });
          break;

        case "ai_rules":
          // AI rules would need a separate update - for now just save as fact
          result = await addFact(businessId, {
            category: "ai_rules",
            title: "AI autonomy preference",
            content: answers.autonomy_level || "",
          });
          break;

        case "content_strategy":
          result = await addFact(businessId, {
            category: "content",
            title: "Content topics",
            content: answers.content_topics || "",
          });
          break;

        case "goals":
          if (answers.primary_goal) {
            result = await addGoal(businessId, {
              goal: answers.primary_goal,
              is_primary: true,
            });
          }
          if (answers.secondary_goal) {
            await addGoal(businessId, {
              goal: answers.secondary_goal,
              is_primary: false,
            });
          }
          break;
      }

      if (result && "success" in result && result.success) {
        setSuccess(true);
        setTimeout(() => {
          onComplete?.();
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span>Saved!</span>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50"
      >
        <span className="text-sm font-medium">{getDomainDisplayName(domain)}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="p-3 pt-0 space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="space-y-1">
              <label className="text-sm text-muted-foreground">{q.label}</label>
              {q.type === "text" && (
                <Input
                  placeholder={q.placeholder}
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              )}
              {q.type === "textarea" && (
                <Textarea
                  placeholder={q.placeholder}
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  rows={2}
                />
              )}
              {q.type === "select" && q.options && (
                <div className="flex flex-wrap gap-1">
                  {q.options.map((opt) => (
                    <Badge
                      key={opt}
                      variant={answers[q.id] === opt ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                    >
                      {opt}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={loading || Object.values(answers).every(v => !v)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
