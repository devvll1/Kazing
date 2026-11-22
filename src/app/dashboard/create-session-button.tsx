"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type SessionResult = { session_id: string; game_pin: string; quiz_title: string };

export function CreateSessionButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function createSession() {
    setError(null);
    setIsCreating(true);

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("create_demo_session");
      const session = (data as SessionResult[] | null)?.[0];

      if (rpcError || !session) {
        setError("We could not start a game. Please try again.");
        return;
      }

      router.push(`/host/${session.session_id}`);
      router.refresh();
    } catch {
      setError("We could not start a game. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="mt-7">
      <Button size="lg" onClick={createSession} disabled={isCreating}>
        {isCreating ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Preparing game…</> : <><Play className="size-4" aria-hidden="true" /> Start the Space Challenge</>}
      </Button>
      {error ? <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
