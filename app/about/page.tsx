import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Cake, Clock, Heart, Leaf, ShieldCheck, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-0">
      {/* Hero Header */}
      <section className="bg-cream py-16 md:py-24 border-b border-line/60">
        <div className="container-shell mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-bold text-orange border border-orange/20 mb-4">
            <Sparkles size={14} /> OUR BAKERY STORY
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-navy">
            Good Bakes Make Good Days.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted font-medium">
            Bake Mart Bazaar is an artisan bakery built around the belief that everyday cravings and grand life celebrations deserve something beautifully made, thoughtfully packaged, and delivered fresh.
          </p>
        </div>
      </section>

      {/* 3 Pillar Values */}
      <section className="container-shell py-16 md:py-24">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col rounded-[28px] bg-white p-8 border border-line/80 shadow-xs">
            <span className="font-display text-5xl font-extrabold text-orange">01</span>
            <h2 className="mt-8 font-display text-2xl font-bold text-navy">Fresh First Philosophy</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted font-medium">
              Our kitchen operates in small batches. We bake to order for your chosen delivery slot, never storing finished cakes in warehouse freezers.
            </p>
          </div>

          <div className="flex flex-col rounded-[28px] bg-white p-8 border border-line/80 shadow-xs">
            <span className="font-display text-5xl font-extrabold text-orange">02</span>
            <h2 className="mt-8 font-display text-2xl font-bold text-navy">Personal Craftsmanship</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted font-medium">
              Whether it's a simple chocolate croissant or a 3-tier custom wedding cake, our master decorators treat every bake as a unique canvas.
            </p>
          </div>

          <div className="flex flex-col rounded-[28px] bg-white p-8 border border-line/80 shadow-xs">
            <span className="font-display text-5xl font-extrabold text-orange">03</span>
            <h2 className="mt-8 font-display text-2xl font-bold text-navy">Pristine Box Delivery</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted font-medium">
              We engineered specialized temperature-controlled cake boxes so your celebration centerpieces arrive looking as stunning as they left our oven.
            </p>
          </div>
        </div>
      </section>

      {/* Story Banner */}
      <section className="bg-navy text-white py-16 md:py-24">
        <div className="container-shell grid gap-10 md:grid-cols-2 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange mb-2">
              Our Lahore Kitchen
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight">
              Baking with Passion & Pure Ingredients
            </h2>
            <p className="mt-5 text-sm sm:text-base leading-relaxed text-white/80 font-medium">
              From our signature triple-layer dark chocolate fudge cake to buttery morning croissants, every item is crafted using real dairy butter, Belgian cocoa, fresh farm eggs, and natural fruit reductions.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-2xl bg-orange px-6 py-4 text-sm font-extrabold text-white shadow-xl hover:bg-orange-dark transition-all"
              >
                <span>Browse Bakery Counter</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/custom-cake"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-white hover:bg-white/20 transition-all"
              >
                <span>Custom Cake Studio</span>
              </Link>
            </div>
          </div>

          <div className="relative aspect-square overflow-hidden rounded-[36px] bg-navy-light border-4 border-white/10 shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1000&q=88"
              alt="Bake Mart Bakery Kitchen"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
