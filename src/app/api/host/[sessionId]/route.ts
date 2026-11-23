import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(_: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.rpc("get_host_game_state", { requested_session_id: sessionId });
  if (error || !data?.[0]) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  return NextResponse.json(data[0]);
}

export async function POST(_: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.rpc("advance_host_question", { requested_session_id: sessionId });
  if (error || !data?.[0]) return NextResponse.json({ error: error?.message ?? "Could not advance the game." }, { status: 400 });
  return NextResponse.json(data[0]);
}
