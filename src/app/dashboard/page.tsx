import { redirect } from "next/navigation";
import { Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { CreateSessionButton } from "./create-session-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f5f1ff] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-bold uppercase tracking-widest text-primary">Kazing! instructor</p><h1 className="mt-1 text-3xl font-black tracking-tight">Your quiz space</h1></div>
          <SignOutButton />
        </header>
        <Card className="mt-10 border-2 border-foreground shadow-[8px_8px_0_#ffb000]"><CardHeader><Rocket className="size-9 text-primary" aria-hidden="true" /><CardTitle className="mt-3 text-2xl">Ready for your first live game?</CardTitle></CardHeader><CardContent><p className="max-w-2xl leading-7 text-muted-foreground">You are signed in as {user.email}. The prepared Python Basics quiz contains ten questions and is ready for your classroom.</p><CreateSessionButton /></CardContent></Card>
      </div>
    </main>
  );
}
