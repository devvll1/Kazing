import Link from "next/link";
import { ArrowLeft, UsersRound } from "lucide-react";
import { JoinForm } from "./join-form";

export default function JoinPage() {
  return <main className="grid min-h-screen place-items-center bg-[#fff8e5] px-5 py-10"><section className="w-full max-w-md rounded-[2rem] border-2 border-foreground bg-card p-8 shadow-[8px_8px_0_#7659e6]"><div className="text-center"><UsersRound className="mx-auto size-10 text-primary" aria-hidden="true" /><p className="mt-5 text-sm font-bold uppercase tracking-widest text-primary">Student area</p><h1 className="mt-2 text-3xl font-black tracking-tight">Join the game</h1><p className="mt-3 leading-7 text-muted-foreground">Enter the Game PIN shown by your instructor.</p></div><JoinForm /><Link href="/" className="mt-8 inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline"><ArrowLeft className="size-4" aria-hidden="true" /> Back to Kazing!</Link></section></main>;
}
