"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stepper } from "@/components/project/Stepper";
import { getAngles, getInput, saveDraftCopy, type AngleRow } from "@/lib/db";

const ANGLE_ACCENTS = [
  "from-indigo-500 to-violet-500",
  "from-violet-500 to-purple-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-orange-500 to-amber-500",
];

export function AnglesScreen({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [angles, setAngles] = useState<AngleRow[] | null>(null);
  const [businessText, setBusinessText] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAngles(projectId), getInput(projectId)])
      .then(([a, input]) => {
        setAngles(a);
        setBusinessText(input?.business_text ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [projectId]);

  async function chooseAngle(angle: AngleRow) {
    setPendingId(angle.id);
    setError(null);
    try {
      const res = await fetch("/api/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          angle: { name: angle.name, core_message: angle.core_message, hook: angle.hook, cta: angle.cta },
          businessText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Copy generation failed.");
      saveDraftCopy(projectId, { angleId: angle.id, copy: data });
      router.push(`/project/${projectId}/brand`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPendingId(null);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#f4f4f8" }}>
      <Stepper current="angles" projectId={projectId} />

      <main className="mx-auto max-w-3xl px-6 py-10">

        {/* Step hero */}
        <div
          className="mb-8 flex items-center gap-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6"
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", animation: "fadeInUp 0.6s ease-out" }}
        >
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-indigo-500">Step 2 of 5</p>
            <h1 className="text-xl font-bold text-zinc-900">Choose a marketing angle</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Each angle is a different reason your buyer would care. Pick one and we&apos;ll write all the ad copy.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            style={{ animation: "scaleIn 0.3s ease-out" }}>
            <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {angles === null && !error && (
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-400"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)", animation: "fadeInUp 0.5s ease-out 0.1s backwards" }}>
            <span className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent"
              style={{ animation: "spin 0.8s linear infinite" }} />
            Generating your angles…
          </div>
        )}

        {angles?.length === 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)", animation: "fadeInUp 0.5s ease-out" }}>
            <p className="text-sm text-zinc-500">No angles found.</p>
            <Link
              href={`/project/${projectId}/input`}
              className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:underline"
            >
              Go back and generate some →
            </Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {angles?.map((angle, i) => {
            const isPending = pendingId === angle.id;
            const gradient = ANGLE_ACCENTS[i % ANGLE_ACCENTS.length];
            return (
              <button
                key={angle.id}
                onClick={() => chooseAngle(angle)}
                disabled={pendingId !== null}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 text-left transition-all hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 disabled:opacity-60"
                style={{
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  animation: `fadeInUp 0.5s ease-out ${0.15 + i * 0.07}s backwards`,
                }}
              >
                {/* Gradient top bar */}
                <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${gradient}`} />

                {/* Hover sheen */}
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99,102,241,0.04), transparent 40%)" }} />

                <div className="flex items-start justify-between gap-3 pt-1">
                  <h2 className="text-sm font-bold leading-snug text-zinc-900">{angle.name}</h2>
                  <span className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {angle.cta}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-zinc-500">{angle.core_message}</p>

                <div className="relative overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
                    style={{ background: `linear-gradient(to bottom, ${gradient.replace("from-", "").replace(" to-", ", ").replace(/-500/g, "")})` }} />
                  <p className="text-xs font-medium italic leading-relaxed text-zinc-600">&ldquo;{angle.hook}&rdquo;</p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-1">
                  {isPending ? (
                    <span className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-indigo-500 border-t-transparent"
                        style={{ animation: "spin 0.8s linear infinite" }} />
                      Writing copy…
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 group-hover:underline">
                      Use this angle
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
