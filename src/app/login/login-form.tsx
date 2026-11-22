"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError("We could not sign you in. Check your email and password, then try again.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Sign-in is unavailable right now. Please try again shortly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-7 grid gap-5 text-left" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required disabled={isSubmitting} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required disabled={isSubmitting} />
      </div>
      {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Signing in…</> : "Sign in to host"}
      </Button>
    </form>
  );
}
