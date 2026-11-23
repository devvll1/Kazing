import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ sessionId: string }> };
function tokenFor(request: NextRequest, sessionId: string) {
  return request.cookies.get("kazing_session_" + sessionId)?.value;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  const token = tokenFor(request, sessionId);
  if (!token) return NextResponse.json({ error: "Join the game first." }, { status: 401 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_player_game_state", { requested_session_id: sessionId, supplied_reconnect_token: token });
  if (error || !data?.[0]) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  return NextResponse.json(data[0]);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  const token = tokenFor(request, sessionId);
  if (!token) return NextResponse.json({ error: "Join the game first." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const answer = typeof body?.answer === "string" ? body.answer : "";
  if (!["A", "B", "C", "D"].includes(answer)) return NextResponse.json({ error: "Choose one answer." }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_player_answer", { requested_session_id: sessionId, supplied_reconnect_token: token, requested_answer: answer });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
