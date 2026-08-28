import { createClient } from "@/lib/supabase/server";

export async function processActionJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: job, error: jobErr } = await supabase
    .from("community_action_jobs")
    .select(`
      *,
      social_conversations (*)
    `)
    .eq("id", jobId)
    .single();

  if (jobErr || !job) {
    return { success: false, error: "Job not found" };
  }

  if (job.status !== "queued" && job.status !== "failed") {
    return { success: false, error: "Job cannot be processed in current state" };
  }

  if (job.attempt_count >= job.max_attempts) {
    return { success: false, error: "Max attempts exceeded" };
  }

  await supabase
    .from("community_action_jobs")
    .update({
      status: "processing",
      attempt_count: job.attempt_count + 1,
      started_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  const conv = job.social_conversations as any;
  const responseText = job.response_text;

  if (!responseText) {
    await supabase
      .from("community_action_jobs")
      .update({
        status: "failed",
        last_error: "No response text provided",
        error_type: "validation_error",
      })
      .eq("id", jobId);

    return { success: false, error: "No response text" };
  }

  try {
    await supabase
      .from("social_messages")
      .insert({
        conversation_id: job.conversation_id,
        direction: "outbound",
        sender_type: "ai",
        text: responseText,
      });

    await supabase
      .from("community_action_jobs")
      .update({
        status: "sent",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await supabase
      .from("social_conversations")
      .update({
        status: "waiting_customer",
        last_outbound_at: new Date().toISOString(),
      })
      .eq("id", job.conversation_id);

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    const newStatus = job.attempt_count + 1 < job.max_attempts ? "queued" : "failed";

    await supabase
      .from("community_action_jobs")
      .update({
        status: newStatus,
        last_error: msg,
        error_type: "provider_error",
      })
      .eq("id", jobId);

    if (newStatus === "failed") {
      await supabase
        .from("social_conversations")
        .update({ status: "escalated" })
        .eq("id", job.conversation_id);
    }

    return { success: false, error: msg };
  }
}

export async function retryActionJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("community_action_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !job) return { success: false, error: "Job not found" };
  if (job.status !== "failed") return { success: false, error: "Only failed jobs can be retried" };

  await supabase
    .from("community_action_jobs")
    .update({
      status: "queued",
      last_error: null,
      error_type: null,
    })
    .eq("id", jobId);

  return processActionJob(jobId);
}

export async function getActionJobs(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("community_action_jobs")
    .select(`
      *,
      social_conversations (id, platform, customer_name, status)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];

  return data || [];
}
