import { redirect } from "next/navigation";
import { Plus, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

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
        <Card className="mt-10 border-2 border-foreground shadow-[8px_8px_0_#ffb000]"><CardHeader><Trophy className="size-9 text-primary" aria-hidden="true" /><CardTitle className="mt-3 text-2xl">Your first live game is almost ready</CardTitle></CardHeader><CardContent><p className="max-w-2xl leading-7 text-muted-foreground">You are signed in as {user.email}. Creating the prepared demo quiz and starting a game session arrives in Ticket 04.</p><div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-bold text-muted-foreground"><Plus className="size-4" aria-hidden="true" /> Quiz creation is not available yet</div></CardContent></Card>
      </div>
    </main>
  );
}
