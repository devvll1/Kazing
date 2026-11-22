"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/");
      router.refresh();
      setIsSigningOut(false);
    }
  }

  return <Button variant="outline" onClick={signOut} disabled={isSigningOut}>{isSigningOut ? "Signing out…" : "Sign out"}</Button>;
}
