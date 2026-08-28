import { createClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";

export async function createOAuthState(params: {
  userId: string;
  businessId: string;
  provider: string;
}): Promise<{ state: string; stateHash: string }> {
  const supabase = await createClient();
  const state = randomBytes(32).toString("hex");
  const stateHash = createHash("sha256").update(state).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabase.from("oauth_states").insert({
    user_id: params.userId,
    business_id: params.businessId,
    provider: params.provider,
    state_hash: stateHash,
    expires_at: expiresAt,
  });

  if (error) throw new Error(`Failed to create OAuth state: ${error.message}`);

  return { state, stateHash };
}

export async function validateOAuthState(params: {
  state: string;
  userId: string;
}): Promise<{ businessId: string; provider: string } | null> {
  const supabase = await createClient();
  const stateHash = createHash("sha256").update(params.state).digest("hex");

  const { data, error } = await supabase
    .from("oauth_states")
    .select("id, business_id, provider, used, expires_at")
    .eq("state_hash", stateHash)
    .eq("user_id", params.userId)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;

  await supabase
    .from("oauth_states")
    .update({ used: true })
    .eq("id", data.id);

  return { businessId: data.business_id, provider: data.provider };
}
