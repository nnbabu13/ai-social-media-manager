import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Business, BusinessMember } from "@/types/database";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getUserBusinessMembership(userId: string): Promise<BusinessMember | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_members")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getUserBusiness(userId: string): Promise<Business | null> {
  const membership = await getUserBusinessMembership(userId);
  if (!membership) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", membership.business_id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function requireBusinessMembership(userId: string): Promise<{ business: Business; membership: BusinessMember }> {
  const supabase = await createClient();

  const { data: membership, error: memberError } = await supabase
    .from("business_members")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (memberError || !membership) {
    redirect("/onboarding");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", membership.business_id)
    .single();

  if (businessError || !business) {
    redirect("/onboarding");
  }

  return { business, membership };
}

export async function requireBusinessOwner(userId: string): Promise<{ business: Business; membership: BusinessMember }> {
  const { business, membership } = await requireBusinessMembership(userId);
  if (membership.role !== "owner") {
    redirect("/dashboard");
  }
  return { business, membership };
}

export async function canAccessBusiness(userId: string, businessId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_members")
    .select("id")
    .eq("user_id", userId)
    .eq("business_id", businessId)
    .single();

  return !error && !!data;
}
