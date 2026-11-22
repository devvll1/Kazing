"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JoinForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setIsJoining(true);
    const formData = new FormData(event.currentTarget);
    const pin = String(formData.get("pin") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    try {
      const response = await fetch("/api/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, name }) });
      const result = await response.json() as { sessionId?: string; error?: string };
      if (!response.ok || !result.sessionId) { setError(result.error ?? "We could not join that game. Check the PIN and try again."); return; }
      router.push(`/game/${result.sessionId}`); router.refresh();
    } catch { setError("We could not join that game. Check your connection and try again."); }
    finally { setIsJoining(false); }
  }
  return <form className="mt-7 grid gap-5 text-left" onSubmit={handleSubmit}>
    <div className="grid gap-2"><Label htmlFor="pin">Game PIN</Label><Input id="pin" name="pin" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="6 digits" required disabled={isJoining} /></div>
    <div className="grid gap-2"><Label htmlFor="name">Display name</Label><Input id="name" name="name" maxLength={32} placeholder="What should the class call you?" required disabled={isJoining} /></div>
    {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
    <Button type="submit" size="lg" disabled={isJoining}>{isJoining ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Joining…</> : "Join game"}</Button>
  </form>;
}
