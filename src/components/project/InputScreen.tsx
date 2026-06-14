"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/project/Stepper";
import { getInput, replaceAngles, saveInput, uploadToBucket } from "@/lib/db";

interface PickedFile { name: string; storage_path: string; text: string; }

export function InputScreen({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [businessText, setBusinessText] = useState("");
  const [competitorText, setCompetitorText] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInput(projectId).then((row) => {
      if (row) {
        setBusinessText(row.business_text ?? "");
        setCompetitorText(row.competitor_text ?? "");
      }
    }).catch(() => {});
  }, [projectId]);

  async function handleFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const picked: PickedFile[] = [];
    for (const file of Array.from(list)) {
      try {
        const storage_path = await uploadToBucket("assets", projectId, file, file.name);
        const isText = /\.(txt|md)$/i.test(file.name);
        const text = isText ? await file.text() : "";
        picked.push({ name: file.name, storage_path, text });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }
    setFiles((f) => [...f, ...picked]);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!businessText.trim()) { setError("Business info is required."); return; }
    setBusy(true);
    setError(null);
    try {
      const uploadedDocsText = files.map((f) => f.text).filter(Boolean).join("\n\n");
      await saveInput(projectId, {
        business_text: businessText,
        competitor_text: competitorText,
        uploaded_files: files.map((f) => ({ name: f.name, storage_path: f.storage_path })),
      });
      const res = await fetch("/api/angles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessText, competitorText, uploadedDocsText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Angle generation failed.");
      await replaceAngles(projectId, data.angles);
      router.push(`/project/${projectId}/angles`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-md px-6 py-3.5">
        <Stepper current="input" projectId={projectId} />
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-500">Step 1 of 5</p>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Tell us about your product</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            We&apos;ll extract distinct marketing angles and write ad copy tailored to your business.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          {/* Business info */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <label className="text-sm font-semibold text-zinc-900">
                  Business info <span className="text-red-500">*</span>
                </label>
                <p className="mt-0.5 text-xs text-zinc-400">What does the product do? Who is it for? What makes it different?</p>
              </div>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500">Required</span>
            </div>
            <textarea
              required
              value={businessText}
              onChange={(e) => setBusinessText(e.target.value)}
              rows={7}
              placeholder="e.g. We build an AI scheduling tool for healthcare clinics that reduces no-shows by 40% through automated SMS reminders…"
              className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Competitor text */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <label className="text-sm font-semibold text-zinc-900">Competitor ad text</label>
                <p className="mt-0.5 text-xs text-zinc-400">Paste competitor copy to generate stronger, differentiated angles.</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-400">Optional</span>
            </div>
            <textarea
              value={competitorText}
              onChange={(e) => setCompetitorText(e.target.value)}
              rows={4}
              placeholder="Paste competitor ad copy here…"
              className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* File upload */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <label className="text-sm font-semibold text-zinc-900">Documents</label>
                <p className="mt-0.5 text-xs text-zinc-400">Upload pitch decks, one-pagers, or any business document.</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-400">Optional · .txt .md .pdf</span>
            </div>
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 text-zinc-500 transition group-hover:bg-indigo-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-700">Click to upload files</p>
                <p className="mt-0.5 text-xs text-zinc-400">.txt, .md, .pdf supported</p>
              </div>
              <input type="file" multiple accept=".txt,.md,.pdf" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
            </label>
            {files.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {files.map((f) => (
                  <li key={f.storage_path} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating angles…
              </>
            ) : (
              <>
                Generate angles
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
