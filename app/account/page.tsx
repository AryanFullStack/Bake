import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Cake, Heart, MapPin, Package, UserRound, LogOut, LayoutDashboard, Sparkles, ArrowRight } from "lucide-react";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile role if user is logged in
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    isAdmin = profile?.role === "admin" || profile?.role === "manager";
  }

  const handleSignOut = async () => {
    "use server";
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();
    redirect("/login");
  };

  return (
    <div className="container-shell py-10 md:py-16">
      {/* Header Profile Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-[32px] bg-white p-8 border border-line/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-bold text-orange border border-orange/20 mb-2">
            <Sparkles size={13} /> CUSTOMER PORTAL
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
            {user ? `Welcome back, ${user.user_metadata?.full_name || "Valued Customer"}.` : "Hello, Guest Baker."}
          </h1>
          <p className="mt-2 text-sm text-muted font-medium">
            {user
              ? `Logged in as ${user.email}`
              : "Log in or create an account to view saved orders, delivery addresses and wishlist."}
          </p>
          {isAdmin && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-xs font-extrabold text-white shadow-xs">
              ✦ Staff / Admin Access Granted
            </span>
          )}
        </div>

        {user && (
          <form action={handleSignOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-xs font-extrabold text-red-600 transition-colors hover:bg-red-100 shadow-xs cursor-pointer"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </form>
        )}
      </div>

      {/* Admin Quick Banner */}
      {isAdmin && (
        <Link
          href="/admin"
          className="mt-6 flex items-center gap-4 rounded-[28px] bg-navy p-6 text-white transition-all hover:bg-navy-light shadow-lg"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange text-white">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <p className="font-bold text-base">Bake Mart Admin Studio</p>
            <p className="mt-0.5 text-xs text-white/70">Manage orders, products, custom cake quotes & site settings</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-extrabold text-orange">
            <span>Enter Admin</span>
            <ArrowRight size={14} />
          </span>
        </Link>
      )}

      {/* Account Navigation Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AccountCard
          href="/account/orders"
          icon={<Package size={24} />}
          title="My Orders"
          description="View order history & live tracking"
        />
        <AccountCard
          href="/account/wishlist"
          icon={<Heart size={24} />}
          title="Wishlist"
          description="Your saved cakes & treats"
        />
        <AccountCard
          href="/account/addresses"
          icon={<MapPin size={24} />}
          title="My Address"
          description="Manage delivery locations"
        />
        {!user ? (
          <AccountCard
            href="/login"
            icon={<UserRound size={24} />}
            title="Log In / Register"
            description="Unlock complete portal"
          />
        ) : (
          <AccountCard
            href="/custom-cake"
            icon={<Cake size={24} />}
            title="Custom Cake Studio"
            description="Request bespoke cake quotes"
          />
        )}
      </div>



      {/* Custom Cake Banner */}
      <div className="mt-10 grid overflow-hidden rounded-[32px] bg-gradient-to-r from-navy via-navy to-navy-light p-8 sm:p-10 text-white shadow-xl">
        <div className="flex flex-col items-start max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange/20 px-3.5 py-1.5 text-xs font-bold text-orange border border-orange/30 mb-3">
            <Cake size={14} /> CELEBRATION CONSULTATION
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Planning a Celebration?</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75 font-medium">
            Send your custom cake brief, reference photos, and flavour ideas directly to our master decorators. We'll send you an exact quote within hours!
          </p>
          <Link
            href="/custom-cake"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange px-6 py-3.5 text-sm font-extrabold text-white shadow-lg hover:bg-orange-dark transition-all"
          >
            <span>Start Custom Cake Inquiry</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function AccountCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-[24px] bg-white p-6 border border-line/80 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/5 hover:border-orange/40"
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange/10 text-orange group-hover:bg-orange group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="mt-5 font-bold text-navy text-lg group-hover:text-orange transition-colors">
        {title}
      </h3>
      <p className="mt-1 text-xs text-muted font-medium">{description}</p>
    </Link>
  );
}

export const dynamic = "force-dynamic";
