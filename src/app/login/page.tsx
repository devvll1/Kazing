import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

export default function LoginPage() {
  return <main className="grid min-h-screen place-items-center bg-[#f5f1ff] px-5 py-10"><section className="w-full max-w-md rounded-[2rem] border-2 border-foreground bg-card p-8 text-center shadow-[8px_8px_0_#ffb000]"><LockKeyhole className="mx-auto size-10 text-primary" aria-hidden="true" /><p className="mt-5 text-sm font-bold uppercase tracking-widest text-primary">Instructor area</p><h1 className="mt-2 text-3xl font-black tracking-tight">Sign-in is next</h1><p className="mt-4 leading-7 text-muted-foreground">Secure Supabase sign-in is being connected in Ticket 03. This screen intentionally does not collect credentials until that connection is ready.</p><Link href="/" className="mt-8 inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline"><ArrowLeft className="size-4" aria-hidden="true" /> Back to Kazing!</Link></section></main>;
}
