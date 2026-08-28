"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createAIProvider, type InterviewQuestion } from "@/lib/ai/provider";
import { revalidatePath } from "next/cache";
import type { InterviewStage } from "@/types/business-brain";
import { buildBusinessContext, getBusinessBrain } from "@/lib/business-brain";

const STAGES: InterviewStage[] = ["business", "products_services", "customers", "brand", "policies", "goals"];

export async function startInterview(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("business_interviews")
    .select("id, status")
    .eq("business_id", businessId)
    .in("status", ["in_progress", "completed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.status === "completed") {
    return { error: "Interview already completed" };
  }

  if (existing?.status === "in_progress") {
    return { interviewId: existing.id };
  }

  const serviceClient = await createServiceClient();
  const { data: interview, error } = await serviceClient
    .from("business_interviews")
    .insert({
      business_id: businessId,
      status: "in_progress",
      current_stage: "business",
      completion_percentage: 0,
    })
    .select("id")
    .single();

  if (error) return { error: "Failed to start interview" };

  const ai = createAIProvider();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, category")
    .eq("id", businessId)
    .single();

  let existingKnowledge = "";
  try {
    const brain = await getBusinessBrain(businessId);
    if (brain) existingKnowledge = buildBusinessContext(brain);
  } catch {}

  const questionResult = await ai.generateInterviewQuestion({
    businessName: business?.name || "Your business",
    category: business?.category || null,
    currentStage: "business",
    previousAnswers: {},
    extractedKnowledge: {},
    existingKnowledge,
  });

  await serviceClient.from("business_interview_messages").insert({
    interview_id: interview.id,
    role: "assistant",
    content: questionResult.question,
    metadata: { stage: "business", type: "question", suggested_answers: questionResult.suggested_answers },
  });

  await serviceClient.from("audit_logs").insert({
    business_id: businessId,
    user_id: user.id,
    action: "AI_INTERVIEW_STARTED",
    entity_type: "business_interview",
    entity_id: interview.id,
  });

  revalidatePath("/business-brain");
  return { interviewId: interview.id };
}

export async function sendMessage(interviewId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: interview } = await supabase
    .from("business_interviews")
    .select("id, business_id, status, current_stage, completion_percentage, knowledge_extracted")
    .eq("id", interviewId)
    .single();

  if (!interview || interview.status !== "in_progress") {
    return { error: "Interview not active" };
  }

  const serviceClient = await createServiceClient();

  await serviceClient.from("business_interview_messages").insert({
    interview_id: interviewId,
    role: "user",
    content,
    metadata: { stage: interview.current_stage },
  });

  const { data: messages } = await supabase
    .from("business_interview_messages")
    .select("role, content, metadata")
    .eq("interview_id", interviewId)
    .order("created_at", { ascending: true });

  const ai = createAIProvider();
  const extraction = await ai.extractBusinessKnowledge(
    (messages || []).map(m => ({ role: m.role as "system" | "assistant" | "user", content: m.content }))
  );

  const shouldAdvance = shouldAdvanceStage(interview.current_stage as InterviewStage, content, messages?.length || 0);
  const newStage = shouldAdvance ? getNextStage(interview.current_stage as InterviewStage) : interview.current_stage;
  const newPercentage = calculateStagePercentage(newStage);

  const previousAnswers: Record<string, string> = {};
  (messages || []).forEach(m => {
    if (m.role === "assistant" && m.metadata && typeof m.metadata === "object" && "type" in m.metadata && m.metadata.type === "question") {
      const q = m.content;
      const matchingUser = messages?.find(u => u.role === "user" && u.metadata && typeof u.metadata === "object" && "stage" in u.metadata && u.metadata.stage === (m.metadata as Record<string, unknown>).stage);
      if (matchingUser) previousAnswers[q] = matchingUser.content;
    }
  });

  let existingKnowledge = "";
  try {
    const brain = await getBusinessBrain(interview.business_id);
    if (brain) existingKnowledge = buildBusinessContext(brain);
  } catch {}

  const questionResult = await ai.generateInterviewQuestion({
    businessName: "",
    category: null,
    currentStage: newStage,
    previousAnswers,
    extractedKnowledge: extraction as unknown as Record<string, unknown>,
    lastUserMessage: content,
    existingKnowledge,
  });

  await serviceClient.from("business_interview_messages").insert({
    interview_id: interviewId,
    role: "assistant",
    content: questionResult.question,
    metadata: { stage: newStage, type: "question" },
  });

  await serviceClient
    .from("business_interviews")
    .update({
      current_stage: newStage,
      completion_percentage: newPercentage,
      knowledge_extracted: extraction as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq("id", interviewId);

  await extractAndStoreKnowledge(interview.business_id, extraction as unknown as Record<string, unknown>);

  revalidatePath("/business-brain/interview");
  return {
    response: questionResult.question,
    stage: newStage,
    percentage: newPercentage,
    extraction,
  };
}

export async function skipQuestion(interviewId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: interview } = await supabase
    .from("business_interviews")
    .select("id, business_id, status, current_stage, completion_percentage")
    .eq("id", interviewId)
    .single();

  if (!interview || interview.status !== "in_progress") {
    return { error: "Interview not active" };
  }

  const serviceClient = await createServiceClient();

  await serviceClient.from("business_interview_messages").insert({
    interview_id: interviewId,
    role: "user",
    content: "[Skipped]",
    metadata: { stage: interview.current_stage, skipped: true },
  });

  const newStage = getNextStage(interview.current_stage as InterviewStage);
  const newPercentage = calculateStagePercentage(newStage);

  const ai = createAIProvider();

  let existingKnowledge = "";
  try {
    const brain = await getBusinessBrain(interview.business_id);
    if (brain) existingKnowledge = buildBusinessContext(brain);
  } catch {}

  const questionResult = await ai.generateInterviewQuestion({
    businessName: "",
    category: null,
    currentStage: newStage,
    previousAnswers: {},
    extractedKnowledge: {},
    lastUserMessage: "skip",
    existingKnowledge,
  });

  await serviceClient.from("business_interview_messages").insert({
    interview_id: interviewId,
    role: "assistant",
    content: questionResult.question,
    metadata: { stage: newStage, type: "question" },
  });

  await serviceClient
    .from("business_interviews")
    .update({
      current_stage: newStage,
      completion_percentage: newPercentage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", interviewId);

  revalidatePath("/business-brain/interview");
  return {
    response: questionResult.question,
    stage: newStage,
    percentage: newPercentage,
  };
}

export async function completeInterview(interviewId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { error } = await serviceClient
    .from("business_interviews")
    .update({
      status: "completed",
      completion_percentage: 100,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", interviewId);

  if (error) return { error: "Failed to complete interview" };

  const { data: interview } = await supabase
    .from("business_interviews")
    .select("business_id")
    .eq("id", interviewId)
    .single();

  if (interview) {
    await serviceClient.from("audit_logs").insert({
      business_id: interview.business_id,
      user_id: user.id,
      action: "AI_INTERVIEW_COMPLETED",
      entity_type: "business_interview",
      entity_id: interviewId,
    });
  }

  revalidatePath("/business-brain");
  return { success: true };
}

export async function getInterview(businessId: string) {
  const supabase = await createClient();

  const { data: interview } = await supabase
    .from("business_interviews")
    .select("*")
    .eq("business_id", businessId)
    .in("status", ["in_progress", "completed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return interview;
}

export async function getInterviewMessages(interviewId: string) {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("business_interview_messages")
    .select("id, role, content, metadata, created_at")
    .eq("interview_id", interviewId)
    .order("created_at", { ascending: true });

  return messages || [];
}

export async function approveKnowledgeItem(businessId: string, entityType: string, entityId: string, data: Record<string, unknown>) {
  const serviceClient = await createServiceClient();

  switch (entityType) {
    case "product":
      await serviceClient.from("business_products").insert({
        business_id: businessId,
        name: data.name as string,
        description: data.description as string,
        source_type: "ai_interview",
        approval_status: "approved",
      });
      break;
    case "service":
      await serviceClient.from("business_services").insert({
        business_id: businessId,
        name: data.name as string,
        description: data.description as string,
        source_type: "ai_interview",
        approval_status: "approved",
      });
      break;
    case "faq":
      await serviceClient.from("business_faqs").insert({
        business_id: businessId,
        question: data.question as string,
        answer: data.answer as string,
        source_type: "ai_interview",
        approval_status: "approved",
      });
      break;
    case "fact":
      await serviceClient.from("business_facts").insert({
        business_id: businessId,
        category: data.category as string,
        title: data.title as string,
        content: data.content as string,
        source_type: "ai_interview",
        approval_status: "approved",
      });
      break;
    case "location":
      await serviceClient.from("business_locations").insert({
        business_id: businessId,
        name: data.name as string,
        city: data.city as string,
        service_area: data.service_area as string,
        source_type: "ai_interview",
        approval_status: "approved",
      });
      break;
    case "persona":
      await serviceClient.from("customer_personas").insert({
        business_id: businessId,
        name: data.name as string,
        description: data.description as string,
        pain_points: data.pain_points as string,
        needs: data.needs as string,
        source_type: "ai_interview",
        approval_status: "approved",
      });
      break;
  }

  revalidatePath("/business-brain");
  return { success: true };
}

function shouldAdvanceStage(currentStage: InterviewStage, userMessage: string, messageCount: number): boolean {
  const skipKeywords = ["skip", "not applicable", "next", "pass", "don't know", "no preference", "idk"];
  const isSkip = skipKeywords.some(k => userMessage.toLowerCase().includes(k));
  if (isSkip) return true;
  // Advance after ~4 user messages per stage (2 questions)
  const userMessages = Math.floor(messageCount / 2);
  if (userMessages >= 2) return true;
  return false;
}

function getNextStage(currentStage: InterviewStage): InterviewStage {
  const currentIndex = STAGES.indexOf(currentStage);
  if (currentIndex < STAGES.length - 1) {
    return STAGES[currentIndex + 1];
  }
  return currentStage;
}

function calculateStagePercentage(stage: InterviewStage): number {
  const stageIndex = STAGES.indexOf(stage);
  const basePercentage = (stageIndex / STAGES.length) * 100;
  const maxStagePercentage = (1 / STAGES.length) * 100;
  return Math.min(Math.round(basePercentage + maxStagePercentage * 0.5), 99);
}

async function extractAndStoreKnowledge(businessId: string, extraction: Record<string, unknown>) {
  const serviceClient = await createServiceClient();

  const products = extraction.products as Array<{ name: string; description: string; confidence: number }> | undefined;
  if (products) {
    for (const product of products) {
      if (product.confidence >= 0.7) {
        const { data: existing } = await serviceClient
          .from("business_products")
          .select("id")
          .eq("business_id", businessId)
          .ilike("name", product.name)
          .limit(1);

        if (!existing || existing.length === 0) {
          await serviceClient.from("business_products").insert({
            business_id: businessId,
            name: product.name,
            description: product.description,
            source_type: "ai_interview",
            approval_status: "pending",
          });
        }
      }
    }
  }

  const services = extraction.services as Array<{ name: string; description: string; confidence: number }> | undefined;
  if (services) {
    for (const service of services) {
      if (service.confidence >= 0.7) {
        await serviceClient.from("business_services").insert({
          business_id: businessId,
          name: service.name,
          description: service.description,
          source_type: "ai_interview",
          approval_status: "pending",
        });
      }
    }
  }

  const facts = extraction.businessFacts as Array<{ category: string; title: string; content: string; confidence: number }> | undefined;
  if (facts) {
    for (const fact of facts) {
      if (fact.confidence >= 0.7) {
        await serviceClient.from("business_facts").insert({
          business_id: businessId,
          category: fact.category,
          title: fact.title,
          content: fact.content,
          source_type: "ai_interview",
          approval_status: "pending",
        });
      }
    }
  }

  const faqs = extraction.faqs as Array<{ question: string; answer: string; confidence: number }> | undefined;
  if (faqs) {
    for (const faq of faqs) {
      if (faq.confidence >= 0.7) {
        await serviceClient.from("business_faqs").insert({
          business_id: businessId,
          question: faq.question,
          answer: faq.answer,
          source_type: "ai_interview",
          approval_status: "pending",
        });
      }
    }
  }

  const locations = extraction.locations as Array<{ name: string; city: string; service_area: string; confidence: number }> | undefined;
  if (locations) {
    for (const location of locations) {
      if (location.confidence >= 0.7) {
        await serviceClient.from("business_locations").insert({
          business_id: businessId,
          name: location.name,
          city: location.city,
          service_area: location.service_area,
          source_type: "ai_interview",
          approval_status: "pending",
        });
      }
    }
  }

  const personas = extraction.customerPersonas as Array<{ name: string; description: string; pain_points: string; needs: string; confidence: number }> | undefined;
  if (personas) {
    for (const persona of personas) {
      if (persona.confidence >= 0.7) {
        await serviceClient.from("customer_personas").insert({
          business_id: businessId,
          name: persona.name,
          description: persona.description,
          pain_points: persona.pain_points,
          needs: persona.needs,
          source_type: "ai_interview",
          approval_status: "pending",
        });
      }
    }
  }
}
