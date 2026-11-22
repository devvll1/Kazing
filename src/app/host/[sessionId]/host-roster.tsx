"use client";

import { useCallback, useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Player = { player_id: string; player_name: string; is_in_lobby: boolean };
export function HostRoster({ sessionId }: { sessionId: string }) {
  const [players, setPlayers] = useState<Player[]>([]); const [error, setError] = useState(false);
  const loadPlayers = useCallback(async () => { const supabase = createClient(); const { data, error: queryError } = await supabase.rpc("get_host_roster", { requested_session_id: sessionId }); if (queryError) { setError(true); return; } setError(false); setPlayers(data as Player[]); }, [sessionId]);
  useEffect(() => { const supabase = createClient(); const channel = supabase.channel(`host-roster-${sessionId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "players", filter: `session_id=eq.${sessionId}` }, () => void loadPlayers()).subscribe(); const refreshTimer = window.setTimeout(() => void loadPlayers(), 0); const reconcileTimer = window.setInterval(() => void loadPlayers(), 2500); return () => { window.clearTimeout(refreshTimer); window.clearInterval(reconcileTimer); void supabase.removeChannel(channel); }; }, [loadPlayers, sessionId]);
  if (error) return <p className="leading-7 text-muted-foreground">The roster is temporarily unavailable. Refresh the page to try again.</p>;
  if (players.length === 0) return <p className="leading-7 text-muted-foreground">No students have joined yet. Share the Game PIN to begin.</p>;
  return <ul className="grid gap-2">{players.map((player) => <li key={player.player_id} className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-2 font-bold"><span className="flex items-center gap-3"><UsersRound className="size-4 text-primary" aria-hidden="true" />{player.player_name}</span><span className={player.is_in_lobby ? "rounded-full bg-green-100 px-2 py-1 text-xs text-green-800" : "rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"}>{player.is_in_lobby ? "In lobby" : "Left"}</span></li>)}</ul>;
}
