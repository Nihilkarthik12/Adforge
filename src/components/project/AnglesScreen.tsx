"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stepper } from "@/components/project/Stepper";
import { getAngles, getInput, saveDraftCopy, type AngleRow } from "@/lib/db";

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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <Stepper current="angles" projectId={projectId} />
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Pick an angle</h1>
          <p className="mt-2 text-sm text-slate-500">
            Choose the marketing angle to turn into a creative — we&apos;ll write all the copy for it.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {angles === null && !error && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Loading angles…
          </div>
        )}

        {angles?.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">No angles yet.</p>
            <Link
              href={`/project/${projectId}/input`}
              className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Go back and generate some →
            </Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {angles?.map((angle) => {
            const isPending = pendingId === angle.id;
            return (
              <button
                key={angle.id}
                onClick={() => chooseAngle(angle)}
                disabled={pendingId !== null}
                className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md disabled:opacity-60"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900">{angle.name}</h2>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {angle.cta}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{angle.core_message}</p>
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium italic text-slate-700">
                  &ldquo;{angle.hook}&rdquo;
                </p>
                <span className="mt-auto text-xs font-semibold text-blue-600 group-hover:underline">
                  {isPending ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Writing copy…
                    </span>
                  ) : (
                    "Use this angle →"
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
