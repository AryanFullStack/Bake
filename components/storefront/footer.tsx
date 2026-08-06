import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Cake, Clock3, Heart, Leaf, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

export function Footer() {
  return <footer className="mt-20 bg-navy pb-24 pt-14 text-white md:pb-8 md:pt-16">
    <div className="container-shell border-b border-white/10 pb-12"><div className="grid gap-8 md:grid-cols-[1.35fr_1fr_1fr_1.2fr]">
      <div>
        <Link href="/" className="inline-block rounded-xl bg-white p-2.5 shadow-md transition-transform hover:scale-[1.02]">
          <Image src="/logobake-01.png" alt="Bake Mart Bazaar" width={200} height={55} className="h-11 w-auto object-contain" />
        </Link>
        <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">A thoughtful bakery for everyday cravings, milestone celebrations and all the good reasons to gather.</p>
        <div className="mt-6 grid gap-2 text-xs font-semibold text-white/70"><span className="flex items-center gap-2"><MapPin size={14} className="text-orange" /> Lahore, Pakistan</span><span className="flex items-center gap-2"><Phone size={14} className="text-orange" /> 0321-1234567</span><span className="flex items-center gap-2"><Mail size={14} className="text-orange" /> hello@bakemartbazaar.pk</span></div>
      </div>
      <FooterColumn title="Explore" links={[["Shop all bakes", "/shop"], ["Celebration cakes", "/shop?category=cakes"], ["Custom cake studio", "/custom-cake"], ["Our story", "/about"], ["Seasonal offers", "/shop?sale=1"]]} />
      <FooterColumn title="Customer care" links={[["Track an order", "/track-order"], ["Track a cake request", "/track-custom-cake"], ["Contact us", "/contact"], ["FAQs", "/faq"], ["Delivery information", "/shipping-delivery"], ["Refund & cancellation", "/refund-cancellation"]]} />
      <div><p className="eyebrow text-orange">Stay in the loop</p><h3 className="mt-3 font-display text-2xl font-bold">A little sweetness, occasionally.</h3><p className="mt-3 text-sm leading-6 text-white/65">Seasonal drops, bakery news and the occasional treat for your inbox.</p><form className="mt-5 flex gap-2"><input required type="email" placeholder="Your email address" className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-3 text-xs text-white outline-none placeholder:text-white/40 focus:border-orange" /><button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-orange text-white hover:bg-orange-dark" aria-label="Subscribe"><ArrowRight size={16} /></button></form><p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/45"><ShieldCheck size={13} className="text-green" /> No spam. Unsubscribe anytime.</p></div>
    </div></div>
    <div className="container-shell flex flex-col gap-4 pt-6 text-[11px] text-white/45 md:flex-row md:items-center md:justify-between"><p>© 2026 Bake Mart Bazaar · Baked with <Heart size={12} className="inline fill-orange text-orange" /> in Lahore</p><div className="flex flex-wrap gap-4"><span className="flex items-center gap-1.5"><Clock3 size={12} /> Fresh daily</span><span className="flex items-center gap-1.5"><Leaf size={12} /> Honest ingredients</span><span className="flex items-center gap-1.5"><Cake size={12} /> Custom celebrations</span><Link href="/admin" className="text-white/25 hover:text-white">Admin portal</Link></div></div>
  </footer>;
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) { return <div><p className="eyebrow text-orange">{title}</p><div className="mt-4 grid gap-3 text-sm font-semibold text-white/70">{links.map(([label, href]) => <Link key={href} href={href} className="transition-colors hover:text-orange">{label}</Link>)}</div></div>; }
