import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Cake, Package, Sparkles } from "lucide-react";
import styles from "./hero.module.css";

/** Server-rendered content; all animation is decorative and progressively enhanced. */
export function MultiCategoryHero() {
  return (
    <section className={styles.hero} aria-label="Welcome to Bake Bazaar Mart">
      <div className={`container-shell ${styles.layout}`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}><span aria-hidden="true" /> A little joy, every day</p>
          <h1 className={styles.title}>Sweet moments.<br /><em>Beautifully made.</em></h1>
          <p className={styles.description}>Celebrate with a cake. Find something lovely for your kitchen. Bring a little more joy home with Bake Bazaar Mart.</p>
          <div className={styles.actions}>
            <Link href="/category/bakery" className={`button-primary ${styles.primary}`}>Explore Bakery <ArrowRight size={18} /></Link>
            <Link href="/custom-cake" className={styles.secondary}>Create Your Cake <ArrowRight size={17} /></Link>
          </div>
          <div className={styles.delivery}>
            <span><Cake size={18} aria-hidden="true" /> Custom cakes in Karachi</span>
            <span><Package size={18} aria-hidden="true" /> Essentials across Pakistan</span>
          </div>
        </div>

        <div className={styles.visuals}>
          <Link href="/custom-cake" className={styles.cakeScene} aria-label="Explore custom celebration cakes">
            <span className={styles.halo} aria-hidden="true" />
            <span className={styles.orbit} aria-hidden="true" />
            <span className={styles.sparkle} aria-hidden="true"><Sparkles size={28} strokeWidth={1.3} /></span>
            <span className={styles.sceneNote} aria-hidden="true">Something sweet<br /><em>to celebrate.</em></span>
            <div className={styles.cakeImage}>
              <Image src="/hero-cake-cutout.webp" alt="Cake inspiration: berry and ivory cream celebration cake with a slice" fill priority quality={80} sizes="(max-width: 639px) 92vw, (max-width: 1023px) 75vw, 46vw" className={styles.image} />
            </div>
            <span className={styles.cakeCaption}><span className={styles.captionLine} aria-hidden="true" /> Made for your moments <ArrowRight size={16} aria-hidden="true" /></span>
          </Link>

          <Link href="/category/kitchen" className={styles.kitchen}>
            <div className={styles.kitchenImage}>
              <Image src="/hero-kitchen-cutout.webp" alt="Kitchen inspiration: mixing bowl, whisk, spatulas, rolling pin and measuring cups" fill sizes="(max-width: 639px) 96px, 120px" quality={75} className={styles.image} />
            </div>
            <div className={styles.kitchenCopy}><span>From baking to everyday living</span><h2>Good things for your kitchen.</h2><p>Explore kitchen essentials &amp; storage</p></div>
            <span className={styles.kitchenArrow}><ArrowRight size={20} aria-hidden="true" /></span>
          </Link>
        </div>
      </div>
      <div className={styles.bottomLine} aria-hidden="true"><span /></div>
    </section>
  );
}
