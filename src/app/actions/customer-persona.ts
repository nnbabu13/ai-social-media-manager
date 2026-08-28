"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getBusinessBrain } from "@/lib/business-brain";
import { generateCustomerPersonasFromBrain } from "@/lib/customer-persona";
import { revalidatePath } from "next/cache";
import { createBusinessBrainVersion } from "@/lib/business-brain/versioning";

export interface CustomerPersonaData {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  segments: string[];
  needs: string[];
  pain_points: string[];
  buying_triggers: string[];
  objections: string[];
  decision_factors: string[];
  desired_outcomes: string[];
  content_interests: string[];
  preferred_channels: string[];
  conversion_action: string;
  priority: string;
  confidence: number;
  source_type: string;
  approval_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCustomerPersonas(businessId: string): Promise<CustomerPersonaData[]> {
  const supabase = await createClient();

  const { data: personas } = await supabase
    .from("customer_personas")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return personas || [];
}

export async function generateCustomerPersonas(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const brain = await getBusinessBrain(businessId);
  if (!brain) return { error: "Business not found" };

  const generated = generateCustomerPersonasFromBrain(brain);

  if (generated.length === 0) {
    return { error: "Not enough information to generate personas. Please add target customers or customer details first." };
  }

  const serviceClient = await createServiceClient();

  const { data: existingPersonas } = await serviceClient
    .from("customer_personas")
    .select("id, source_type")
    .eq("business_id", businessId)
    .eq("is_active", true);

  const aiDerivedIds = (existingPersonas || [])
    .filter(p => p.source_type !== "owner_confirmed")
    .map(p => p.id);

  if (aiDerivedIds.length > 0) {
    await serviceClient
      .from("customer_personas")
      .update({ is_active: false })
      .in("id", aiDerivedIds);
  }

  const insertedPersonas: CustomerPersonaData[] = [];

  for (const persona of generated) {
    const result = await serviceClient
      .from("customer_personas")
      .insert({
        business_id: businessId,
        name: persona.name,
        description: persona.description,
        segments: persona.segments,
        needs: persona.needs.join("; "),
        pain_points: persona.pain_points.join("; "),
        buying_triggers: persona.buying_triggers.join("; "),
        objections: persona.objections.join("; "),
        decision_factors: persona.decision_factors,
        desired_outcomes: persona.desired_outcomes,
        content_interests: persona.content_interests,
        preferred_channels: persona.preferred_channels,
        conversion_action: persona.conversion_action,
        priority: persona.priority,
        confidence: persona.confidence,
        source_type: persona.source_type,
        approval_status: persona.approval_status,
      })
      .select()
      .single();

    if (result.data) {
      insertedPersonas.push(result.data);
    }
  }

  await createBusinessBrainVersion({
    businessId,
    changeType: "customer_persona_updated",
    changeSummary: `Generated ${insertedPersonas.length} customer persona(s)`,
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/personas");

  return { personas: insertedPersonas };
}

export async function updateCustomerPersona(personaId: string, updates: Partial<CustomerPersonaData>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { id, business_id, created_at, ...updateData } = updates;

  const result = await serviceClient
    .from("customer_personas")
    .update({
      ...updateData,
      source_type: "owner_confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", personaId)
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to update persona" };
  }

  await createBusinessBrainVersion({
    businessId: result.data.business_id,
    changeType: "customer_persona_updated",
    changeSummary: `Updated persona: ${result.data.name}`,
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/personas");

  return { persona: result.data };
}

export async function addCustomerPersona(businessId: string, persona: Omit<CustomerPersonaData, "id" | "business_id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const result = await serviceClient
    .from("customer_personas")
    .insert({
      business_id: businessId,
      ...persona,
      source_type: "owner_confirmed",
      approval_status: "approved",
    })
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to add persona" };
  }

  await createBusinessBrainVersion({
    businessId,
    changeType: "customer_persona_updated",
    changeSummary: `Added persona: ${persona.name}`,
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/personas");

  return { persona: result.data };
}

export async function deactivateCustomerPersona(personaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { data: persona } = await serviceClient
    .from("customer_personas")
    .select("business_id, name")
    .eq("id", personaId)
    .single();

  const result = await serviceClient
    .from("customer_personas")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", personaId);

  if (result.error) {
    return { error: "Failed to deactivate persona" };
  }

  if (persona?.business_id) {
    await createBusinessBrainVersion({
      businessId: persona.business_id,
      changeType: "customer_persona_updated",
      changeSummary: `Deactivated persona: ${persona.name}`,
      createdBy: user.id,
    });
  }

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/personas");

  return { success: true };
}

export async function approveCustomerPersona(personaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { data: persona } = await serviceClient
    .from("customer_personas")
    .select("business_id, name")
    .eq("id", personaId)
    .single();

  const result = await serviceClient
    .from("customer_personas")
    .update({
      approval_status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", personaId)
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to approve persona" };
  }

  if (persona?.business_id) {
    await createBusinessBrainVersion({
      businessId: persona.business_id,
      changeType: "customer_persona_updated",
      changeSummary: `Approved persona: ${persona.name}`,
      createdBy: user.id,
    });
  }

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/personas");

  return { persona: result.data };
}
