import Link from "next/link";
import { PartyPopper } from "lucide-react";

type WaitingLobbyProps = { searchParams: Promise<{ name?: string }> };
export default async function WaitingLobbyPage({ searchParams }: WaitingLobbyProps) {
  const { name } = await searchParams; const playerName = name?.slice(0, 32) || "Player";
  return <main className="grid min-h-screen place-items-center bg-[#f5f1ff] px-5 py-10"><section className="w-full max-w-md rounded-[2rem] border-2 border-foreground bg-card p-8 text-center shadow-[8px_8px_0_#ffb000]"><PartyPopper className="mx-auto size-10 text-primary" aria-hidden="true" /><p className="mt-5 text-sm font-bold uppercase tracking-widest text-primary">You&apos;re in!</p><h1 className="mt-2 text-3xl font-black tracking-tight">Welcome, {playerName}</h1><p className="mt-4 leading-7 text-muted-foreground">You&apos;re in the lobby. Keep this page open while your instructor starts the game.</p><Link href="/join" className="mt-8 inline-flex font-bold text-primary underline-offset-4 hover:underline">Join a different game</Link></section></main>;
}
