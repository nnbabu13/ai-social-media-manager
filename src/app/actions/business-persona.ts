"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getBusinessBrain } from "@/lib/business-brain";
import { generateBusinessPersonaFromBrain } from "@/lib/business-persona";
import type { BusinessPersona, BusinessPersonaUpdate } from "@/types/business-persona";
import { businessPersonaSchema, businessPersonaUpdateSchema } from "@/types/business-persona";
import { revalidatePath } from "next/cache";
import { createBusinessBrainVersion } from "@/lib/business-brain/versioning";

export async function getBusinessPersona(businessId: string): Promise<BusinessPersona | null> {
  const supabase = await createClient();

  const { data: persona } = await supabase
    .from("business_persona")
    .select("*")
    .eq("business_id", businessId)
    .single();

  return persona;
}

export async function generateBusinessPersona(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const brain = await getBusinessBrain(businessId);
  if (!brain) return { error: "Business not found" };

  const generated = generateBusinessPersonaFromBrain(brain);
  const personaWithBusinessId = { ...generated, business_id: businessId };

  const validation = businessPersonaSchema.safeParse(personaWithBusinessId);
  if (!validation.success) {
    return { error: "Invalid persona data", details: validation.error.flatten() };
  }

  const serviceClient = await createServiceClient();

  const { data: existing } = await serviceClient
    .from("business_persona")
    .select("id")
    .eq("business_id", businessId)
    .single();

  let result;
  if (existing) {
    const { data: existingPersona } = await serviceClient
      .from("business_persona")
      .select("source_type, owner_edited_fields")
      .eq("id", existing.id)
      .single();

    const isOwnerConfirmed = existingPersona?.source_type === "owner_confirmed";

    let mergedData = { ...validation.data };

    if (isOwnerConfirmed && existingPersona?.owner_edited_fields) {
      const ownerFields = existingPersona.owner_edited_fields as string[];
      for (const field of ownerFields) {
        if (field in mergedData) {
          delete (mergedData as Record<string, unknown>)[field];
        }
      }
    }

    result = await serviceClient
      .from("business_persona")
      .update({
        ...mergedData,
        source_type: isOwnerConfirmed ? "owner_confirmed" : "ai_derived",
        approval_status: isOwnerConfirmed ? "approved" : "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    result = await serviceClient
      .from("business_persona")
      .insert(validation.data)
      .select()
      .single();
  }

  if (result.error) {
    return { error: "Failed to save persona", details: result.error.message };
  }

  await createBusinessBrainVersion({
    businessId,
    changeType: "business_persona_updated",
    changeSummary: "Business persona generated/updated",
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/personas");

  return { persona: result.data };
}

export async function updateBusinessPersona(businessId: string, updates: Partial<BusinessPersonaUpdate>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { data: existing } = await serviceClient
    .from("business_persona")
    .select("id")
    .eq("business_id", businessId)
    .single();

  if (!existing) {
    return { error: "No persona found" };
  }

  const { id, ...updateData } = updates;

  const result = await serviceClient
    .from("business_persona")
    .update({
      ...updateData,
      source_type: "owner_confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to update persona", details: result.error.message };
  }

  await createBusinessBrainVersion({
    businessId,
    changeType: "business_persona_updated",
    changeSummary: "Business persona updated by owner",
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/personas");

  return { persona: result.data };
}

export async function approveBusinessPersona(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const result = await serviceClient
    .from("business_persona")
    .update({
      approval_status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", businessId)
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to approve persona" };
  }

  await createBusinessBrainVersion({
    businessId,
    changeType: "business_persona_updated",
    changeSummary: "Business persona approved by owner",
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/personas");

  return { persona: result.data };
}

export async function deleteBusinessPersona(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const result = await serviceClient
    .from("business_persona")
    .delete()
    .eq("business_id", businessId);

  if (result.error) {
    return { error: "Failed to delete persona" };
  }

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/personas");

  return { success: true };
}
