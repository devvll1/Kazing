import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type JoinResult = {
  session_id: string;
  player_name: string;
  reconnect_token: string;
};

export async function POST(request: NextRequest) {
  let pin = "";
  let name = "";

  try {
    const body = await request.json();
    pin = typeof body.pin === "string" ? body.pin.trim() : "";
    name = typeof body.name === "string" ? body.name.trim() : "";
  } catch {
    return NextResponse.json({ error: "Enter a Game PIN and display name." }, { status: 400 });
  }

  if (!/^\d{6}$/.test(pin) || name.length === 0 || name.length > 32) {
    return NextResponse.json({ error: "Enter a six-digit Game PIN and a display name." }, { status: 400 });
  }

  const reconnectToken = request.cookies.get(`kazing_reconnect_${pin}`)?.value ?? null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_lobby", {
    requested_pin: pin,
    requested_name: name,
    supplied_reconnect_token: reconnectToken,
  });
  const player = (data as JoinResult[] | null)?.[0];

  if (error || !player) {
    const message = error?.message?.includes("display name") || error?.message?.includes("Game PIN")
      ? error.message
      : "We could not join that game. Check the PIN and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const response = NextResponse.json({ sessionId: player.session_id });
  response.cookies.set(`kazing_reconnect_${pin}`, player.reconnect_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  response.cookies.set(`kazing_session_${player.session_id}`, player.reconnect_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}
