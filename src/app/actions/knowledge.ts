"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createBusinessBrainVersion, type BrainChangeType } from "@/lib/business-brain/versioning";

const TABLE_MAP: Record<string, string> = {
  products: "business_products",
  services: "business_services",
  faqs: "business_faqs",
  facts: "business_facts",
  locations: "business_locations",
  offers: "business_offers",
  personas: "customer_personas",
};

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  return { user, serviceClient: await createServiceClient() };
}

function handleResult(result: { error: unknown } | null, action: string) {
  if (result?.error) {
    const message = typeof result.error === "string" ? result.error : (result.error as { message: string })?.message || "Unknown error";
    return { error: `Failed to ${action}: ${message}` };
  }
  return { success: true as const };
}

function revalidate() {
  revalidatePath("/business-brain");
  revalidatePath("/business-brain/knowledge");
}

async function createVersionAfterChange(businessId: string, changeType: BrainChangeType, summary: string, userId?: string) {
  await createBusinessBrainVersion({ businessId, changeType, changeSummary: summary, createdBy: userId });
}

// Products
export async function addProduct(businessId: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const result = await auth.serviceClient.from("business_products").insert({
    business_id: businessId,
    name: data.name,
    description: data.description || null,
    price: data.price ? parseFloat(data.price) : null,
    price_visibility: data.price_visibility || "on_request",
    is_active: true,
    source_type: "owner",
  });
  revalidate();
  await createVersionAfterChange(businessId, "offering_updated", `Added product: ${data.name}`, auth.user.id);
  return handleResult(result, "add product");
}

export async function updateProduct(id: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: product } = await auth.serviceClient.from("business_products").select("business_id").eq("id", id).single();
  const result = await auth.serviceClient.from("business_products").update({
    name: data.name,
    description: data.description || null,
    price: data.price ? parseFloat(data.price) : null,
    price_visibility: data.price_visibility || "on_request",
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  revalidate();
  if (product?.business_id) {
    await createVersionAfterChange(product.business_id, "offering_updated", `Updated product: ${data.name}`, auth.user.id);
  }
  return handleResult(result, "update product");
}

export async function deleteProduct(id: string) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: product } = await auth.serviceClient.from("business_products").select("business_id, name").eq("id", id).single();
  const result = await auth.serviceClient.from("business_products").delete().eq("id", id);
  revalidate();
  if (product?.business_id) {
    await createVersionAfterChange(product.business_id, "offering_updated", `Deleted product: ${product.name}`, auth.user.id);
  }
  return handleResult(result, "delete product");
}

// Services
export async function addService(businessId: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const result = await auth.serviceClient.from("business_services").insert({
    business_id: businessId,
    name: data.name,
    description: data.description || null,
    price_text: data.price_text || null,
    is_active: true,
    source_type: "owner",
    approval_status: "approved",
  });
  revalidate();
  await createVersionAfterChange(businessId, "offering_updated", `Added service: ${data.name}`, auth.user.id);
  return handleResult(result, "add service");
}

export async function updateService(id: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: service } = await auth.serviceClient.from("business_services").select("business_id").eq("id", id).single();
  const result = await auth.serviceClient.from("business_services").update({
    name: data.name,
    description: data.description || null,
    price_text: data.price_text || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  revalidate();
  if (service?.business_id) {
    await createVersionAfterChange(service.business_id, "offering_updated", `Updated service: ${data.name}`, auth.user.id);
  }
  return handleResult(result, "update service");
}

export async function deleteService(id: string) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: service } = await auth.serviceClient.from("business_services").select("business_id, name").eq("id", id).single();
  const result = await auth.serviceClient.from("business_services").delete().eq("id", id);
  revalidate();
  if (service?.business_id) {
    await createVersionAfterChange(service.business_id, "offering_updated", `Deleted service: ${service.name}`, auth.user.id);
  }
  return handleResult(result, "delete service");
}

// FAQs
export async function addFaq(businessId: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const result = await auth.serviceClient.from("business_faqs").insert({
    business_id: businessId,
    question: data.question,
    answer: data.answer,
    category: data.category || null,
    is_active: true,
    source_type: "owner",
    approval_status: "approved",
  });
  revalidate();
  await createVersionAfterChange(businessId, "faq_updated", `Added FAQ: ${data.question}`, auth.user.id);
  return handleResult(result, "add FAQ");
}

export async function updateFaq(id: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: faq } = await auth.serviceClient.from("business_faqs").select("business_id").eq("id", id).single();
  const result = await auth.serviceClient.from("business_faqs").update({
    question: data.question,
    answer: data.answer,
    category: data.category || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  revalidate();
  if (faq?.business_id) {
    await createVersionAfterChange(faq.business_id, "faq_updated", `Updated FAQ: ${data.question}`, auth.user.id);
  }
  return handleResult(result, "update FAQ");
}

export async function deleteFaq(id: string) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: faq } = await auth.serviceClient.from("business_faqs").select("business_id, question").eq("id", id).single();
  const result = await auth.serviceClient.from("business_faqs").delete().eq("id", id);
  revalidate();
  if (faq?.business_id) {
    await createVersionAfterChange(faq.business_id, "faq_updated", `Deleted FAQ: ${faq.question}`, auth.user.id);
  }
  return handleResult(result, "delete FAQ");
}

// Facts
export async function addFact(businessId: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const result = await auth.serviceClient.from("business_facts").insert({
    business_id: businessId,
    title: data.title,
    content: data.content,
    category: data.category || "general",
    is_active: true,
    source_type: "owner",
    approval_status: "approved",
  });
  revalidate();
  await createVersionAfterChange(businessId, "knowledge_updated", `Added fact: ${data.title}`, auth.user.id);
  return handleResult(result, "add fact");
}

export async function updateFact(id: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: fact } = await auth.serviceClient.from("business_facts").select("business_id").eq("id", id).single();
  const result = await auth.serviceClient.from("business_facts").update({
    title: data.title,
    content: data.content,
    category: data.category || "general",
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  revalidate();
  if (fact?.business_id) {
    await createVersionAfterChange(fact.business_id, "knowledge_updated", `Updated fact: ${data.title}`, auth.user.id);
  }
  return handleResult(result, "update fact");
}

export async function deleteFact(id: string) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: fact } = await auth.serviceClient.from("business_facts").select("business_id, title").eq("id", id).single();
  const result = await auth.serviceClient.from("business_facts").delete().eq("id", id);
  revalidate();
  if (fact?.business_id) {
    await createVersionAfterChange(fact.business_id, "knowledge_updated", `Deleted fact: ${fact.title}`, auth.user.id);
  }
  return handleResult(result, "delete fact");
}

// Locations
export async function addLocation(businessId: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const result = await auth.serviceClient.from("business_locations").insert({
    business_id: businessId,
    name: data.name,
    city: data.city || null,
    region: data.region || null,
    country: data.country || null,
    service_area: data.service_area || null,
    is_active: true,
  });
  revalidate();
  await createVersionAfterChange(businessId, "knowledge_updated", `Added location: ${data.name}`, auth.user.id);
  return handleResult(result, "add location");
}

export async function updateLocation(id: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: location } = await auth.serviceClient.from("business_locations").select("business_id").eq("id", id).single();
  const result = await auth.serviceClient.from("business_locations").update({
    name: data.name,
    city: data.city || null,
    region: data.region || null,
    country: data.country || null,
    service_area: data.service_area || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  revalidate();
  if (location?.business_id) {
    await createVersionAfterChange(location.business_id, "knowledge_updated", `Updated location: ${data.name}`, auth.user.id);
  }
  return handleResult(result, "update location");
}

export async function deleteLocation(id: string) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: location } = await auth.serviceClient.from("business_locations").select("business_id, name").eq("id", id).single();
  const result = await auth.serviceClient.from("business_locations").delete().eq("id", id);
  revalidate();
  if (location?.business_id) {
    await createVersionAfterChange(location.business_id, "knowledge_updated", `Deleted location: ${location.name}`, auth.user.id);
  }
  return handleResult(result, "delete location");
}

// Offers
export async function addOffer(businessId: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const result = await auth.serviceClient.from("business_offers").insert({
    business_id: businessId,
    name: data.name,
    description: data.description,
    discount_text: data.discount_text || null,
    terms: data.terms || null,
    is_active: true,
  });
  revalidate();
  await createVersionAfterChange(businessId, "knowledge_updated", `Added offer: ${data.name}`, auth.user.id);
  return handleResult(result, "add offer");
}

export async function updateOffer(id: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: offer } = await auth.serviceClient.from("business_offers").select("business_id").eq("id", id).single();
  const result = await auth.serviceClient.from("business_offers").update({
    name: data.name,
    description: data.description,
    discount_text: data.discount_text || null,
    terms: data.terms || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  revalidate();
  if (offer?.business_id) {
    await createVersionAfterChange(offer.business_id, "knowledge_updated", `Updated offer: ${data.name}`, auth.user.id);
  }
  return handleResult(result, "update offer");
}

export async function deleteOffer(id: string) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: offer } = await auth.serviceClient.from("business_offers").select("business_id, name").eq("id", id).single();
  const result = await auth.serviceClient.from("business_offers").delete().eq("id", id);
  revalidate();
  if (offer?.business_id) {
    await createVersionAfterChange(offer.business_id, "knowledge_updated", `Deleted offer: ${offer.name}`, auth.user.id);
  }
  return handleResult(result, "delete offer");
}

// Personas
export async function addPersona(businessId: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const result = await auth.serviceClient.from("customer_personas").insert({
    business_id: businessId,
    name: data.name,
    description: data.description || null,
    pain_points: data.pain_points || null,
    needs: data.needs || null,
    is_active: true,
    source_type: "owner",
  });
  revalidate();
  await createVersionAfterChange(businessId, "customer_persona_updated", `Added persona: ${data.name}`, auth.user.id);
  return handleResult(result, "add persona");
}

export async function updatePersona(id: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: persona } = await auth.serviceClient.from("customer_personas").select("business_id").eq("id", id).single();
  const result = await auth.serviceClient.from("customer_personas").update({
    name: data.name,
    description: data.description || null,
    pain_points: data.pain_points || null,
    needs: data.needs || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  revalidate();
  if (persona?.business_id) {
    await createVersionAfterChange(persona.business_id, "customer_persona_updated", `Updated persona: ${data.name}`, auth.user.id);
  }
  return handleResult(result, "update persona");
}

export async function deletePersona(id: string) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: persona } = await auth.serviceClient.from("customer_personas").select("business_id, name").eq("id", id).single();
  const result = await auth.serviceClient.from("customer_personas").delete().eq("id", id);
  revalidate();
  if (persona?.business_id) {
    await createVersionAfterChange(persona.business_id, "customer_persona_updated", `Deleted persona: ${persona.name}`, auth.user.id);
  }
  return handleResult(result, "delete persona");
}

// Business update
export async function updateBusiness(businessId: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name) updateData.name = data.name;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.region !== undefined) updateData.region = data.region;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.target_customers !== undefined) updateData.target_customers = data.target_customers;
  if (data.website_url !== undefined) updateData.website_url = data.website_url;
  const result = await auth.serviceClient.from("businesses").update(updateData).eq("id", businessId);
  revalidate();
  await createVersionAfterChange(businessId, "business_updated", `Updated business: ${data.name || businessId}`, auth.user.id);
  return handleResult(result, "update business");
}

// Goals
export async function addGoal(businessId: string, data: Record<string, string | boolean>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const result = await auth.serviceClient.from("business_goals").insert({
    business_id: businessId,
    goal: data.goal as string,
    is_primary: data.is_primary === true || data.is_primary === "true",
  });
  revalidate();
  await createVersionAfterChange(businessId, "business_updated", `Added goal: ${data.goal}`, auth.user.id);
  return handleResult(result, "add goal");
}

// Brand tone
export async function updateBrandTone(businessId: string, data: Record<string, string>) {
  const auth = await getAuth();
  if ("error" in auth) return { error: auth.error };
  const { data: existing } = await auth.serviceClient.from("brand_profiles").select("id").eq("business_id", businessId).single();
  if (existing) {
    const result = await auth.serviceClient.from("brand_profiles").update({
      tone: data.tone || null,
      style_description: data.style_description || null,
      updated_at: new Date().toISOString(),
    }).eq("business_id", businessId);
    revalidate();
    await createVersionAfterChange(businessId, "knowledge_updated", `Updated brand tone`, auth.user.id);
    return handleResult(result, "update brand tone");
  }
  const result = await auth.serviceClient.from("brand_profiles").insert({
    business_id: businessId,
    tone: data.tone || null,
    style_description: data.style_description || null,
  });
  revalidate();
  await createVersionAfterChange(businessId, "knowledge_updated", `Created brand tone`, auth.user.id);
  return handleResult(result, "create brand tone");
}

// Search
export async function searchKnowledge(businessId: string, query: string) {
  const supabase = await createClient();
  const results: Record<string, unknown[]> = {};
  const searchTypes = ["products", "services", "faqs", "facts", "offers", "locations", "personas"];

  if (searchTypes.includes("products")) {
    const { data } = await supabase
      .from("business_products").select("id, name, description")
      .eq("business_id", businessId).eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`).limit(10);
    results.products = data || [];
  }
  if (searchTypes.includes("services")) {
    const { data } = await supabase
      .from("business_services").select("id, name, description")
      .eq("business_id", businessId).eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`).limit(10);
    results.services = data || [];
  }
  if (searchTypes.includes("faqs")) {
    const { data } = await supabase
      .from("business_faqs").select("id, question, answer")
      .eq("business_id", businessId).eq("is_active", true)
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%`).limit(10);
    results.faqs = data || [];
  }
  if (searchTypes.includes("facts")) {
    const { data } = await supabase
      .from("business_facts").select("id, title, content, category")
      .eq("business_id", businessId).eq("is_active", true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`).limit(10);
    results.facts = data || [];
  }
  if (searchTypes.includes("offers")) {
    const { data } = await supabase
      .from("business_offers").select("id, name, description")
      .eq("business_id", businessId).eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`).limit(10);
    results.offers = data || [];
  }
  if (searchTypes.includes("locations")) {
    const { data } = await supabase
      .from("business_locations").select("id, name, address, city")
      .eq("business_id", businessId).eq("is_active", true)
      .or(`name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`).limit(10);
    results.locations = data || [];
  }
  if (searchTypes.includes("personas")) {
    const { data } = await supabase
      .from("customer_personas").select("id, name, description")
      .eq("business_id", businessId).eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`).limit(10);
    results.personas = data || [];
  }

  return results;
}
