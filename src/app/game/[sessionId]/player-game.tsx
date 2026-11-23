"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type GameState = {
  session_status: "LOBBY" | "ACTIVE" | "FINISHED";
  session_question_id: string | null;
  question_number: number;
  total_questions: number;
  question_text: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  question_deadline: string | null;
  has_answered: boolean;
};

const answerKeys = ["A", "B", "C", "D"] as const;

export function PlayerGame({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<GameState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadState = useCallback(async () => {
    const response = await fetch("/api/game/" + sessionId, { cache: "no-store" });
    if (!response.ok) return;
    setState(await response.json() as GameState);
  }, [sessionId]);

  useEffect(() => {
    void loadState();
    const gameTimer = window.setInterval(() => { void loadState(); setNow(Date.now()); }, 1000);
    return () => window.clearInterval(gameTimer);
  }, [loadState]);

  const secondsLeft = useMemo(() => state?.question_deadline ? Math.max(0, Math.ceil((new Date(state.question_deadline).getTime() - now) / 1000)) : 0, [now, state?.question_deadline]);

  async function submit(answer: typeof answerKeys[number]) {
    setIsSubmitting(true); setError(null);
    const response = await fetch("/api/game/" + sessionId, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer }) });
    if (!response.ok) {
      const result = await response.json().catch(() => null) as { error?: string } | null;
      setError(result?.error ?? "Your answer could not be saved.");
    }
    await loadState();
    setIsSubmitting(false);
  }

  if (!state) return <p className="mt-6 text-center text-muted-foreground">Checking game status…</p>;
  if (state.session_status === "LOBBY") return <p className="mt-6 text-center text-muted-foreground">Waiting for your instructor to start the game.</p>;
  if (state.session_status === "FINISHED") return <p className="mt-6 rounded-xl bg-muted px-4 py-3 text-center font-bold">The game has finished.</p>;
  if (!state.question_text) return <p className="mt-6 text-center text-muted-foreground">Waiting for the next question.</p>;

  const options = [state.option_a, state.option_b, state.option_c, state.option_d];
  const locked = state.has_answered || secondsLeft === 0 || isSubmitting;
  return <section className="mt-7 text-left">
    <div className="flex items-center justify-between gap-4"><p className="text-sm font-bold text-primary">Question {state.question_number} of {state.total_questions}</p><p className="rounded-full bg-[#ffe7a8] px-3 py-1 text-sm font-black text-[#6a4300]">{secondsLeft}s left</p></div>
    <h2 className="mt-4 text-2xl font-black tracking-tight">{state.question_text}</h2>
    <div className="mt-6 grid gap-3">{options.map((option, index) => <Button key={answerKeys[index]} variant="outline" size="lg" className="h-auto justify-start whitespace-normal px-4 py-4 text-left" disabled={locked} onClick={() => void submit(answerKeys[index])}><span className="mr-3 grid size-7 shrink-0 place-items-center rounded-lg bg-[#eee9ff] text-xs font-black text-primary">{answerKeys[index]}</span>{option}</Button>)}</div>
    {state.has_answered ? <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-center font-bold text-green-800">Answer submitted. Wait for the next question.</p> : null}
    {secondsLeft === 0 && !state.has_answered ? <p className="mt-5 rounded-xl bg-muted px-4 py-3 text-center font-bold">Time is up. Wait for the next question.</p> : null}
    {error ? <p role="alert" className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
  </section>;
}
