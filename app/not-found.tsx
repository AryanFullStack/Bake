import Link from "next/link";
import { ArrowRight, Cake } from "lucide-react";

export default function NotFound() {
  return <main className="container-shell flex min-h-[60vh] items-center justify-center py-20"><div className="max-w-lg text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-light text-orange"><Cake size={26} /></span><p className="eyebrow mt-6">A little detour</p><h1 className="mt-3 font-display text-5xl font-bold text-navy">That page has gone out of the oven.</h1><p className="mt-4 text-sm leading-7 text-muted">The link may be out of date, but there are still plenty of good things waiting at the bakery.</p><Link href="/shop" className="button-primary mt-7">Browse fresh bakes <ArrowRight size={16} /></Link></div></main>;
}
