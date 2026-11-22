import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f1ff] px-5 py-10">
      <section className="w-full max-w-md rounded-[2rem] border-2 border-foreground bg-card p-8 shadow-[8px_8px_0_#ffb000]">
        <div className="text-center">
          <LockKeyhole className="mx-auto size-10 text-primary" aria-hidden="true" />
          <p className="mt-5 text-sm font-bold uppercase tracking-widest text-primary">Instructor area</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Welcome back</h1>
          <p className="mt-3 leading-7 text-muted-foreground">Sign in to prepare and host your next live quiz.</p>
        </div>
        <LoginForm />
        <Link href="/" className="mt-8 inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline"><ArrowLeft className="size-4" aria-hidden="true" /> Back to Kazing!</Link>
      </section>
    </main>
  );
}
