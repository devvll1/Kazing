"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Play, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

type GameState = {
  session_status: "LOBBY" | "ACTIVE" | "FINISHED";
  question_number: number;
  total_questions: number;
  question_text: string | null;
  question_deadline: string | null;
};

export function HostGameControls({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<GameState | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadState = useCallback(async () => {
    const response = await fetch("/api/host/" + sessionId, { cache: "no-store" });
    if (!response.ok) return;
    setState(await response.json() as GameState);
  }, [sessionId]);

  useEffect(() => {
    void loadState();
    const timer = window.setInterval(() => void loadState(), 1000);
    return () => window.clearInterval(timer);
  }, [loadState]);

  async function advance() {
    setIsAdvancing(true); setError(null);
    const response = await fetch("/api/host/" + sessionId, { method: "POST" });
    if (!response.ok) {
      const result = await response.json().catch(() => null) as { error?: string } | null;
      setError(result?.error ?? "Could not advance the game.");
    }
    await loadState();
    setIsAdvancing(false);
  }

  if (!state) return <p className="text-sm text-muted-foreground">Loading game controls…</p>;
  if (state.session_status === "FINISHED") return <p className="rounded-xl bg-muted px-4 py-3 font-bold">This game has finished.</p>;
  const isLobby = state.session_status === "LOBBY";
  return <div className="mt-6 grid gap-3">
    {state.question_text ? <p className="rounded-xl bg-muted px-4 py-3 text-sm font-bold">Question {state.question_number} of {state.total_questions}: {state.question_text}</p> : null}
    <Button size="lg" onClick={advance} disabled={isAdvancing}>
      {isAdvancing ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Loading…</> : isLobby ? <><Play className="size-4" aria-hidden="true" /> Start game</> : <><SkipForward className="size-4" aria-hidden="true" /> Next question</>}
    </Button>
    {error ? <p role="alert" className="text-sm font-medium text-red-700">{error}</p> : null}
  </div>;
}
