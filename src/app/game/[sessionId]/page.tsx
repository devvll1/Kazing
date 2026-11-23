import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { WaitingLobbyClient } from "./waiting-lobby-client";
import { PlayerGame } from "./player-game";

export const dynamic = "force-dynamic";

type WaitingLobbyProps = { params: Promise<{ sessionId: string }> };

export default async function WaitingLobbyPage({ params }: WaitingLobbyProps) {
  const { sessionId } = await params;
  const cookieStore = await cookies();
  const reconnectToken = cookieStore.get(`kazing_session_${sessionId}`)?.value;
  if (!reconnectToken) redirect("/join");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_player_lobby", {
    requested_session_id: sessionId,
    supplied_reconnect_token: reconnectToken,
  });
  const player = data?.[0];
  if (error || !player) notFound();

  return <main className="grid min-h-screen place-items-center bg-[#f5f1ff] px-5 py-10"><section className="w-full max-w-md rounded-[2rem] border-2 border-foreground bg-card p-8 text-center shadow-[8px_8px_0_#ffb000]"><PartyPopper className="mx-auto size-10 text-primary" aria-hidden="true" /><p className="mt-5 text-sm font-bold uppercase tracking-widest text-primary">You&apos;re in!</p><h1 className="mt-2 text-3xl font-black tracking-tight">Welcome, {player.player_name}</h1><p className="mt-4 leading-7 text-muted-foreground">{player.session_title}</p><PlayerGame sessionId={sessionId} /><WaitingLobbyClient sessionId={sessionId} /></section></main>;
}
