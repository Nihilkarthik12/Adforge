"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const supabase = getSupabaseBrowser();
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then log in.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden"
        style={{ background: "#07071a" }}
      >
        {/* Animated glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
              animation: "floatY 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute top-1/3 -right-20 h-[500px] w-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
              animation: "floatY 11s ease-in-out infinite 2s",
            }}
          />
          <div
            className="absolute -bottom-20 left-1/4 h-[400px] w-[400px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)",
              animation: "floatY 9s ease-in-out infinite 1s",
            }}
          />
        </div>

        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff10 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <div style={{ animation: "fadeInLeft 0.6s ease-out" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/40">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
                </svg>
              </div>
              <span className="text-base font-semibold text-white tracking-tight">AdForge</span>
            </div>
          </div>

          {/* Middle */}
          <div className="my-auto pt-8 pb-6">
            <div style={{ animation: "fadeInLeft 0.6s ease-out 0.1s backwards" }}>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-indigo-400">
                AI Ad Creative Platform
              </p>
              <h1 className="text-[2.6rem] font-extrabold leading-[1.1] text-white">
                Turn docs into<br />
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                  on-brand ads
                </span>
                <br />in minutes.
              </h1>
              <p className="mt-4 max-w-[360px] text-[15px] leading-relaxed text-zinc-400">
                AI-written copy poured into fully editable ad templates. No designers, no raw image generation.
              </p>
            </div>

            {/* Product mockup */}
            <div
              className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-sm max-w-[400px]"
              style={{ animation: "scaleIn 0.7s ease-out 0.3s backwards" }}
            >
              <div className="mb-3 flex items-center gap-1.5 border-b border-white/10 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                <span className="ml-3 h-3 w-32 rounded-full bg-white/10" />
                <span className="ml-auto h-3 w-12 rounded-full bg-white/10" />
              </div>
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #0f0f1a 100%)" }}
              >
                <div className="p-5">
                  <div className="h-2 w-16 rounded-full bg-indigo-400/40 mb-3" />
                  <div className="h-7 w-52 rounded-lg bg-white/90 mb-2" />
                  <div className="h-4 w-40 rounded bg-white/30 mb-1.5" />
                  <div className="h-4 w-32 rounded bg-white/20 mb-5" />
                  <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2">
                    <span className="h-2.5 w-14 rounded-full bg-white/80" />
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-white/10 bg-white/5 px-4 py-2.5">
                  <span className="h-2 w-8 rounded-full bg-white/20" />
                  <span className="h-2 w-12 rounded-full bg-white/20" />
                  <span className="ml-auto h-2 w-16 rounded-full bg-indigo-400/40" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 px-1">
                {["Layers", "Properties", "Export"].map((t) => (
                  <span key={t} className="text-[10px] text-zinc-500">{t}</span>
                ))}
                <span className="ml-auto flex items-center">
                  <span className="h-5 w-12 rounded bg-indigo-600/60 text-[9px] font-bold text-white flex items-center justify-center">PNG</span>
                </span>
              </div>
            </div>

            {/* Feature bullets — staggered */}
            <div className="mt-8 flex flex-col gap-4">
              {[
                { text: "AI extracts distinct marketing angles from your business docs", delay: "0.45s" },
                { text: "Auto-fills branded templates with precision-written ad copy", delay: "0.55s" },
                { text: "Export pixel-perfect PNG or JPEG — every layer stays editable", delay: "0.65s" },
              ].map(({ text, delay }) => (
                <div
                  key={text}
                  className="flex items-start gap-3"
                  style={{ animation: `fadeInLeft 0.5s ease-out ${delay} backwards` }}
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 ring-1 ring-indigo-500/25">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-sm leading-relaxed text-zinc-300">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="border-t border-white/10 pt-5"
            style={{ animation: "fadeInLeft 0.5s ease-out 0.7s backwards" }}
          >
            <p className="text-xs text-zinc-600">© 2025 AdForge · Built for B2B SaaS teams</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div
        className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12"
        style={{ background: "linear-gradient(160deg, #eef2ff 0%, #faf5ff 55%, #ede9fe 100%)" }}
      >
        {/* Rotating decorative ring — large */}
        <div
          className="pointer-events-none absolute -right-28 -top-28 h-[480px] w-[480px] rounded-full border-[1.5px] border-indigo-300/25"
          style={{ animation: "rotateSlow 28s linear infinite" }}
        >
          <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-indigo-400/50 shadow-sm shadow-indigo-400/50" />
        </div>

        {/* Rotating ring — medium */}
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full border border-violet-300/20"
          style={{ animation: "rotateSlow 20s linear infinite reverse" }}
        >
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-violet-400/40" />
        </div>

        {/* Floating dots */}
        <div className="pointer-events-none absolute left-16 top-1/4 h-3 w-3 rounded-full bg-indigo-300/50"
          style={{ animation: "floatY 5s ease-in-out infinite" }} />
        <div className="pointer-events-none absolute right-20 top-2/3 h-2 w-2 rounded-full bg-violet-300/50"
          style={{ animation: "floatY 6.5s ease-in-out infinite 1.5s" }} />
        <div className="pointer-events-none absolute left-1/3 bottom-1/4 h-1.5 w-1.5 rounded-full bg-indigo-200/70"
          style={{ animation: "floatY 4s ease-in-out infinite 0.8s" }} />
        <div className="pointer-events-none absolute right-1/3 top-1/3 h-2.5 w-2.5 rounded-full bg-purple-300/30"
          style={{ animation: "floatY 7s ease-in-out infinite 2s" }} />

        {/* Mesh gradient blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 h-80 w-80 rounded-full opacity-40"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)" }} />
        </div>

        {/* Mobile logo */}
        <div
          className="relative z-10 mb-8 flex items-center gap-2.5 lg:hidden"
          style={{ animation: "fadeInUp 0.5s ease-out" }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
            </svg>
          </div>
          <span className="text-base font-semibold text-zinc-900">AdForge</span>
        </div>

        {/* Card wrapper with gradient border */}
        <div
          className="relative z-10 w-full max-w-[400px]"
          style={{ animation: "fadeInUp 0.7s ease-out 0.1s backwards" }}
        >
          {/* Gradient border shell */}
          <div
            className="rounded-[22px] p-[1.5px]"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.45) 0%, rgba(139,92,246,0.2) 50%, rgba(99,102,241,0.08) 100%)",
            }}
          >
            <div
              className="rounded-[21px] bg-white px-9 py-10"
              style={{ boxShadow: "0 24px 64px -12px rgba(99,102,241,0.18), 0 8px 24px -4px rgba(0,0,0,0.07)" }}
            >
              {/* Icon badge */}
              <div
                className="mb-6 flex h-13 w-13 items-center justify-center rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #eef2ff, #ede9fe)",
                  width: 52, height: 52,
                  animation: "scaleIn 0.5s ease-out 0.3s backwards",
                  boxShadow: "0 2px 12px rgba(99,102,241,0.15)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {isSignup ? (
                    <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>
                  ) : (
                    <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
                  )}
                </svg>
              </div>

              {/* Heading */}
              <div style={{ animation: "fadeInUp 0.5s ease-out 0.35s backwards" }}>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                  {isSignup ? "Create your account" : "Welcome back"}
                </h2>
                <p className="mt-1.5 text-sm text-zinc-500">
                  {isSignup
                    ? "Start building ad creatives in minutes."
                    : "Sign in to continue to your workspace."}
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="mt-7 flex flex-col gap-4"
                style={{ animation: "fadeInUp 0.5s ease-out 0.45s backwards" }}
              >
                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    Email address
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-indigo-500">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-500/15"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    Password
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-indigo-500">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-500/15"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    style={{ animation: "scaleIn 0.3s ease-out" }}>
                    <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}
                {notice && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                    style={{ animation: "scaleIn 0.3s ease-out" }}>
                    <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    {notice}
                  </div>
                )}

                {/* CTA button — animated glow */}
                <button
                  type="submit"
                  disabled={busy}
                  className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    animation: "glowPulse 3s ease-in-out infinite",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.40)",
                  }}
                >
                  {/* Shimmer sweep on hover */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/10 transition-transform duration-700 group-hover:translate-x-[200%]" />
                  {busy && <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent" style={{ animation: "spin 0.8s linear infinite" }} />}
                  {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
                </button>
              </form>

              {/* Trust strip */}
              <div
                className="mt-6 flex items-center justify-center gap-5 border-t border-zinc-100 pt-5"
                style={{ animation: "fadeInUp 0.5s ease-out 0.55s backwards" }}
              >
                {[
                  { path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "SSL secured" },
                  { path: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", label: "Private" },
                  { path: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3", label: "No spam" },
                ].map(({ path, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round">
                      <path d={path} />
                    </svg>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Below-card link */}
          <p
            className="mt-6 text-center text-sm text-zinc-500"
            style={{ animation: "fadeInUp 0.5s ease-out 0.6s backwards" }}
          >
            {isSignup ? (
              <>Already have an account?{" "}
                <Link href="/login" className="font-semibold text-indigo-600 transition hover:text-indigo-700">Sign in</Link>
              </>
            ) : (
              <>Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-semibold text-indigo-600 transition hover:text-indigo-700">Sign up free</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
