import Link from "next/link";
import { ArrowRight, Gamepad2, Trophy, UsersRound } from "lucide-react";

const steps = [
  { number: "01", title: "Host creates a game", detail: "Launch a quiz and share the six-digit Game PIN." },
  { number: "02", title: "Class joins in", detail: "Students enter the PIN and choose a display name." },
  { number: "03", title: "Play live", detail: "Everyone answers together and races up the leaderboard." },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_#ffd86b_0,_transparent_28rem),linear-gradient(135deg,_#fff8e5_0%,_#fffdf8_48%,_#f2efff_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black tracking-tight text-foreground"><span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[4px_4px_0_#ffb000]">K!</span><span className="text-xl">Kazing!</span></Link>
          <span className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur">Classroom quiz game</span>
        </header>
        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ffe7a8] px-3 py-1.5 text-sm font-bold text-[#6a4300]"><Gamepad2 className="size-4" aria-hidden="true" /> Ready, set, learn</p>
            <h1 className="text-5xl font-black tracking-[-0.06em] text-foreground sm:text-6xl lg:text-7xl">Make every quiz a <span className="text-primary">Kazing!</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">A live classroom quiz game where every student gets the same question, the same countdown, and a reason to lean in.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link href="/login" className="group rounded-3xl bg-primary p-6 text-primary-foreground shadow-[6px_6px_0_#ffb000] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"><span className="mb-4 grid size-11 place-items-center rounded-2xl bg-white/15"><Trophy className="size-6" aria-hidden="true" /></span><span className="flex items-center justify-between text-lg font-bold">I&apos;m an instructor <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span><span className="mt-1 block text-sm text-white/70">Create and host a game</span></Link>
              <Link href="/join" className="group rounded-3xl border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_#7659e6] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"><span className="mb-4 grid size-11 place-items-center rounded-2xl bg-[#eee9ff] text-[#5b44c8]"><UsersRound className="size-6" aria-hidden="true" /></span><span className="flex items-center justify-between text-lg font-bold">Join a game <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span><span className="mt-1 block text-sm text-muted-foreground">Use your Game PIN</span></Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md rounded-[2.5rem] border-2 border-foreground bg-card p-5 shadow-[10px_10px_0_#7659e6]"><div className="rounded-[2rem] bg-[#f5f1ff] p-6"><div className="flex items-center justify-between text-sm font-bold text-[#5b44c8]"><span>PYTHON BASICS</span><span>12:08</span></div><h2 className="mt-9 text-2xl font-black tracking-tight">Which command displays text on the screen?</h2><div className="mt-7 grid gap-3">{["show()", "print()", "write()", "display()"].map((answer, index) => <div key={answer} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 text-sm font-bold shadow-sm"><span className="grid size-7 place-items-center rounded-lg bg-[#ffe7a8] text-[#6a4300]">{String.fromCharCode(65 + index)}</span>{answer}</div>)}</div><p className="mt-6 text-center text-sm font-semibold text-muted-foreground">A synchronized question preview</p></div></div>
        </section>
        <section className="grid gap-3 border-t border-border py-8 sm:grid-cols-3">{steps.map((step) => <div key={step.number} className="flex gap-3 rounded-2xl bg-card/70 p-4"><span className="font-mono text-sm font-black text-[#5b44c8]">{step.number}</span><div><h2 className="font-bold">{step.title}</h2><p className="mt-1 text-sm text-muted-foreground">{step.detail}</p></div></div>)}</section>
      </div>
    </main>
  );
}
