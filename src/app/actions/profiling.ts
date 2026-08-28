"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createAIProvider } from "@/lib/ai/provider";
import { getBusinessBrain, buildBusinessContext } from "@/lib/business-brain";
import { generateSmartProfilingScreens } from "@/lib/business-profiling/smart-profiler";
import type { ProfilingAnswer, ProfilingScreen } from "@/types/business-profiling";
import type { ProfilingData } from "@/lib/ai/provider";
import { revalidatePath } from "next/cache";

export async function startProfiling(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const brain = await getBusinessBrain(businessId);
  if (!brain) return { error: "Business not found" };

  const screens = generateSmartProfilingScreens(brain);

  return {
    screens,
    totalScreens: screens.length,
    businessName: brain.business.name,
    category: brain.business.category,
  };
}

export async function saveProfilingAnswers(
  businessId: string,
  screenId: string,
  answers: ProfilingAnswer[],
  allScreenAnswers: Record<string, ProfilingAnswer[]>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { data: existing } = await serviceClient
    .from("business_profiling_sessions")
    .select("id")
    .eq("business_id", businessId)
    .eq("status", "in_progress")
    .limit(1)
    .maybeSingle();

  if (existing) {
    await serviceClient
      .from("business_profiling_sessions")
      .update({
        answers: allScreenAnswers,
        current_screen: Object.keys(allScreenAnswers).length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await serviceClient.from("business_profiling_sessions").insert({
      business_id: businessId,
      status: "in_progress",
      answers: allScreenAnswers,
      current_screen: Object.keys(allScreenAnswers).length,
    });
  }

  revalidatePath("/business-brain/profiling");
  return { success: true };
}

export async function generatePersonas(businessId: string, allScreenAnswers: Record<string, ProfilingAnswer[]>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const brain = await getBusinessBrain(businessId);
  const businessContext = brain ? buildBusinessContext(brain) : "";

  const profilingData: ProfilingData = {
    customer_segments: [],
    customer_needs: [],
    buying_triggers: [],
    pain_points: [],
    differentiators: [],
    conversion_actions: [],
    content_interests: [],
    communication_preferences: [],
    custom_inputs: [],
  };

  for (const [screenId, screenAnswers] of Object.entries(allScreenAnswers)) {
    for (const answer of screenAnswers) {
      const stage = answer.question_id as keyof ProfilingData;
      if (stage in profilingData && stage !== "custom_inputs") {
        (profilingData[stage] as string[]).push(...answer.selected_option_ids);
      }
      if (answer.custom_text) {
        profilingData.custom_inputs.push(answer.custom_text);
      }
    }
  }

  const ai = createAIProvider();
  const result = await ai.generatePersonas(profilingData, businessContext);

  const serviceClient = await createServiceClient();

  for (const persona of result.personas) {
    await serviceClient.from("customer_personas").insert({
      business_id: businessId,
      name: persona.name,
      description: persona.description,
      pain_points: persona.pain_points.join("; "),
      needs: persona.needs.join("; "),
      source_type: persona.source === "owner_confirmed" ? "owner" : "ai",
      approval_status: "pending",
      confidence: persona.confidence,
      priority: persona.priority,
      segments: persona.segments,
      buying_triggers: persona.buying_triggers,
      objections: persona.objections,
      content_interests: persona.content_interests,
      preferred_channels: persona.preferred_channels,
    });
  }

  // Save answers as business facts for domain evaluation
  for (const [screenId, screenAnswers] of Object.entries(allScreenAnswers)) {
    for (const answer of screenAnswers) {
      const domain = answer.question_id;
      const selectedLabels = answer.selected_option_ids.map(id => id).filter(Boolean);

      if (selectedLabels.length > 0) {
        await serviceClient.from("business_facts").insert({
          business_id: businessId,
          category: domain,
          title: `${domain.replace(/_/g, " ")} profiling answer`,
          content: selectedLabels.join("; "),
          source_type: "owner",
          approval_status: "approved",
        });
      }

      if (answer.custom_text) {
        await serviceClient.from("business_facts").insert({
          business_id: businessId,
          category: domain,
          title: `${domain.replace(/_/g, " ")} custom answer`,
          content: answer.custom_text,
          source_type: "owner",
          approval_status: "approved",
        });
      }
    }
  }

  await serviceClient
    .from("business_profiling_sessions")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .eq("status", "in_progress");

  if (result.derived_insights.length > 0) {
    for (const insight of result.derived_insights) {
      await serviceClient.from("business_facts").insert({
        business_id: businessId,
        category: "customer_insight",
        title: "AI-derived insight",
        content: insight,
        source_type: "ai",
        approval_status: "pending",
      });
    }
  }

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/profiling");

  return {
    personas: result.personas,
    derived_insights: result.derived_insights,
  };
}

export async function approvePersona(businessId: string, personaIndex: number, editedPersona?: Record<string, unknown>) {
  const serviceClient = await createServiceClient();

  const { data: personas } = await serviceClient
    .from("customer_personas")
    .select("id")
    .eq("business_id", businessId)
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });

  if (personas && personas[personaIndex]) {
    const updateData: Record<string, unknown> = {
      approval_status: "approved",
      source_type: "owner",
    };

    if (editedPersona) {
      if (editedPersona.name) updateData.name = editedPersona.name;
      if (editedPersona.description) updateData.description = editedPersona.description;
      if (editedPersona.pain_points) updateData.pain_points = editedPersona.pain_points;
      if (editedPersona.needs) updateData.needs = editedPersona.needs;
    }

    await serviceClient
      .from("customer_personas")
      .update(updateData)
      .eq("id", personas[personaIndex].id);
  }

  revalidatePath("/business-brain");
  return { success: true };
}

export async function approveAllPersonas(businessId: string) {
  const serviceClient = await createServiceClient();

  await serviceClient
    .from("customer_personas")
    .update({ approval_status: "approved" })
    .eq("business_id", businessId)
    .eq("approval_status", "pending");

  revalidatePath("/business-brain");
  return { success: true };
}

export async function getPendingPersonas(businessId: string) {
  const supabase = await createClient();

  const { data: personas } = await supabase
    .from("customer_personas")
    .select("*")
    .eq("business_id", businessId)
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });

  return personas || [];
}

export async function getProfilingStatus(businessId: string) {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("business_profiling_sessions")
    .select("id, status, current_screen, answers")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return session;
}
