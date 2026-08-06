"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/account");
      router.refresh();
    }, 1500);
  };

  return (
    <div className="container-shell py-12 md:py-20">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[36px] bg-white border border-line/80 shadow-xl grid md:grid-cols-2">
        {/* Left Side: Branded Bakery Imagery Panel */}
        <div className="relative hidden md:flex flex-col justify-between p-10 bg-navy text-white pattern-navy-dots">
          <Link href="/" className="inline-block w-fit rounded-xl bg-white p-2.5 shadow-md transition-transform hover:scale-[1.02]">
            <Image src="/logobake-01.png" alt="Bake Mart Bazaar" width={180} height={50} className="h-10 w-auto object-contain" />
          </Link>

          <div className="my-auto py-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange/20 px-3.5 py-1.5 text-xs font-bold text-orange border border-orange/30 mb-4">
              <Sparkles size={14} /> JOIN THE BAKERY CLUB
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight">
              Smarter checkout & exclusive perks.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70 font-medium">
              Create an account to save multiple delivery addresses, track your cake orders, build your wishlist, and enjoy instant re-ordering.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/50 border-t border-white/10 pt-4">
            <ShieldCheck size={16} className="text-green" /> 100% Free Account • No Spam Guaranteed
          </div>
        </div>

        {/* Right Side: Clean Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange">
            Get Started Today
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy">
            Create Customer Account
          </h1>
          <p className="mt-1 text-xs text-muted font-medium">
            Fill in your details below to register.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl bg-red-50 p-4 border border-red-200 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-2xl bg-green/10 p-4 border border-green/20 text-xs font-bold text-green flex items-center gap-2">
              <Check size={16} /> Account created successfully! Redirecting to customer portal...
            </div>
          )}

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleRegister}>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy">
              Full Name
              <div className="relative mt-2">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sara Ahmed"
                  className="w-full rounded-xl border border-line bg-cream/50 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-orange focus:bg-white transition-colors"
                />
              </div>
            </label>

            <label className="block text-xs font-bold uppercase tracking-wider text-navy">
              Email Address
              <div className="relative mt-2">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sara@example.com"
                  className="w-full rounded-xl border border-line bg-cream/50 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-orange focus:bg-white transition-colors"
                />
              </div>
            </label>

            <label className="block text-xs font-bold uppercase tracking-wider text-navy">
              Password (Min. 6 characters)
              <div className="relative mt-2">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-line bg-cream/50 py-3 pl-10 pr-12 text-sm font-medium outline-none focus:border-orange focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-navy"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange py-4 text-sm font-extrabold text-white shadow-xl shadow-orange/20 hover:bg-orange-dark transition-all disabled:opacity-50"
            >
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 border-t border-line pt-4 text-center text-xs font-medium text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-orange hover:underline">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
