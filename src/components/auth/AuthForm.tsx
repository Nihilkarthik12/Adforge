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
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden"
        style={{ background: "#07071a" }}>

        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />
          <div className="absolute top-1/3 -right-20 h-[500px] w-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-20 left-1/4 h-[400px] w-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)" }} />
        </div>

        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff10 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/40">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
              </svg>
            </div>
            <span className="text-base font-semibold text-white tracking-tight">AdForge</span>
          </div>

          {/* Middle: headline + mockup */}
          <div className="my-auto pt-8 pb-6">
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

            {/* Fake product preview */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-sm max-w-[400px]">
              {/* Window chrome */}
              <div className="mb-3 flex items-center gap-1.5 border-b border-white/10 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                <span className="ml-3 h-3 w-32 rounded-full bg-white/10" />
                <span className="ml-auto h-3 w-12 rounded-full bg-white/10" />
              </div>
              {/* Fake canvas */}
              <div className="rounded-xl overflow-hidden"
                style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #0f0f1a 100%)" }}>
                <div className="p-5">
                  <div className="h-2 w-16 rounded-full bg-indigo-400/40 mb-3" />
                  <div className="h-7 w-52 rounded-lg bg-white/90 mb-2" />
                  <div className="h-4 w-40 rounded bg-white/30 mb-1.5" />
                  <div className="h-4 w-32 rounded bg-white/20 mb-5" />
                  <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2">
                    <span className="h-2.5 w-14 rounded-full bg-white/80" />
                  </div>
                </div>
                {/* Bottom strip */}
                <div className="flex items-center gap-2 border-t border-white/10 bg-white/5 px-4 py-2.5">
                  <span className="h-2 w-8 rounded-full bg-white/20" />
                  <span className="h-2 w-12 rounded-full bg-white/20" />
                  <span className="ml-auto h-2 w-16 rounded-full bg-indigo-400/40" />
                </div>
              </div>
              {/* Toolbar mock */}
              <div className="mt-2 flex items-center gap-2 px-1">
                {["Layers", "Properties", "Export"].map((t) => (
                  <span key={t} className="text-[10px] text-zinc-500">{t}</span>
                ))}
                <span className="ml-auto flex items-center gap-1">
                  <span className="h-5 w-12 rounded bg-indigo-600/60 text-[9px] font-bold text-white flex items-center justify-center">PNG</span>
                </span>
              </div>
            </div>

            {/* Feature bullets */}
            <div className="mt-8 flex flex-col gap-3.5">
              {[
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", text: "AI extracts distinct marketing angles from your business docs" },
                { icon: "M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm0 8a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6zm12 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-6z", text: "Auto-fills branded templates with precision-written ad copy" },
                { icon: "M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4", text: "Export pixel-perfect PNG or JPEG — every layer stays editable" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 ring-1 ring-indigo-500/25">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={icon} />
                    </svg>
                  </div>
                  <span className="text-sm leading-relaxed text-zinc-400">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 pt-5">
            <p className="text-xs text-zinc-600">© 2025 AdForge · Built for B2B SaaS teams</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12"
        style={{ background: "#f4f4f8" }}>

        {/* Soft corner glow */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)" }} />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 65%)" }} />

        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, #00000009 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }} />

        {/* Mobile logo */}
        <div className="relative z-10 mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
            </svg>
          </div>
          <span className="text-base font-semibold text-zinc-900">AdForge</span>
        </div>

        {/* Form card */}
        <div className="relative z-10 w-full max-w-[400px]">
          <div className="rounded-2xl border border-white/80 bg-white px-9 py-10"
            style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)" }}>

            {/* Card top: icon + heading */}
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 ring-2 ring-indigo-100">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {isSignup
                    ? <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>
                    : <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
                  }
                </svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                {isSignup ? "Create your account" : "Welcome back"}
              </h2>
              <p className="mt-1.5 text-sm text-zinc-500">
                {isSignup
                  ? "Start building ad creatives in minutes."
                  : "Sign in to continue to your workspace."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Email address
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
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
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
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
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}
              {notice && (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  {notice}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.40), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
              </button>
            </form>

            {/* Trust strip */}
            <div className="mt-6 flex items-center justify-center gap-4 border-t border-zinc-100 pt-5">
              {[
                { path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "SSL secured" },
                { path: "M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z", label: "Private data" },
                { path: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3", label: "No spam" },
              ].map(({ path, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d={path} />
                  </svg>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Below-card link */}
          <p className="mt-6 text-center text-sm text-zinc-500">
            {isSignup ? (
              <>Already have an account?{" "}
                <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link>
              </>
            ) : (
              <>Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign up free</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
