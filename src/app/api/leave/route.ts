import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let sessionId = "";
  try {
    const body = await request.json();
    sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  } catch {
    return NextResponse.json({ error: "Invalid leave request." }, { status: 400 });
  }

  const reconnectToken = request.cookies.get(`kazing_session_${sessionId}`)?.value;
  if (!reconnectToken) return NextResponse.json({ error: "Player session not found." }, { status: 401 });

  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_lobby", {
    requested_session_id: sessionId,
    supplied_reconnect_token: reconnectToken,
  });
  if (error) return NextResponse.json({ error: "Could not leave the lobby." }, { status: 400 });

  return new NextResponse(null, { status: 204 });
}
