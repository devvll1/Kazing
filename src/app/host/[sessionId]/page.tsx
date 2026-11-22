import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Copy, UsersRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type HostLobbyProps = { params: Promise<{ sessionId: string }> };

export default async function HostLobbyPage({ params }: HostLobbyProps) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("session_id, game_pin, status")
    .eq("session_id", sessionId)
    .eq("host_user_id", user.id)
    .single();

  if (sessionError || !session) notFound();

  return (
    <main className="min-h-screen bg-[#fff8e5] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-primary">Host lobby</p><h1 className="mt-1 text-3xl font-black tracking-tight">Kazing! Space Challenge</h1></div><Link className="font-bold text-primary underline-offset-4 hover:underline" href="/dashboard">Back to dashboard</Link></header>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_.8fr]">
          <Card className="border-2 border-foreground shadow-[8px_8px_0_#ffb000]"><CardHeader><CardTitle>Share this Game PIN</CardTitle></CardHeader><CardContent><p className="rounded-2xl bg-[#271d47] px-5 py-7 text-center font-mono text-5xl font-black tracking-[0.2em] text-white sm:text-6xl">{session.game_pin}</p><p className="mt-5 leading-7 text-muted-foreground">Ask students to open Kazing! and enter this PIN. Joining becomes available in Ticket 05.</p><p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary"><Copy className="size-4" aria-hidden="true" /> Status: {session.status.toLowerCase()}</p></CardContent></Card>
          <Card className="border-2 border-foreground bg-[#f5f1ff]"><CardHeader><UsersRound className="size-9 text-primary" aria-hidden="true" /><CardTitle className="mt-3">Lobby roster</CardTitle></CardHeader><CardContent><p className="leading-7 text-muted-foreground">No students have joined yet. The live roster and game-start control arrive after the student join flow is secured.</p></CardContent></Card>
        </div>
      </div>
    </main>
  );
}
