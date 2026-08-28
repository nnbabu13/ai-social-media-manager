import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: interview } = await supabase
    .from("business_interviews")
    .select("id, business_id")
    .eq("id", params.id)
    .single();

  if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

  const { data: messages } = await supabase
    .from("business_interview_messages")
    .select("id, role, content, metadata, created_at")
    .eq("interview_id", params.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ messages: messages || [] });
}
