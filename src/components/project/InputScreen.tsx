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
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-3.5">
        <Stepper current="input" projectId={projectId} />
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tell us about your product</h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            We&apos;ll extract distinct marketing angles and write ad copy tailored to your business.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col gap-5">
          {/* Business info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-slate-800">
                Business info <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">Required</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">What does the product do? Who is it for? What makes it different?</p>
            <textarea
              required
              value={businessText}
              onChange={(e) => setBusinessText(e.target.value)}
              rows={7}
              placeholder="e.g. We build an AI scheduling tool for healthcare clinics that reduces no-shows by 40% through automated SMS reminders…"
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Competitor text */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-slate-800">Competitor ad text</label>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">Optional</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Paste competitor ad copy to generate stronger, differentiated angles.</p>
            <textarea
              value={competitorText}
              onChange={(e) => setCompetitorText(e.target.value)}
              rows={4}
              placeholder="Paste competitor ad copy here…"
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* File upload */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-slate-800">Documents</label>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">Optional · .txt .md .pdf</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Upload pitch decks, one-pagers, or any business document.</p>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50">
              <span className="text-2xl">📎</span>
              <span className="text-sm font-medium text-slate-600">Click to upload files</span>
              <span className="text-xs text-slate-400">.txt, .md, .pdf supported</span>
              <input type="file" multiple accept=".txt,.md,.pdf" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
            </label>
            {files.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {files.map((f) => (
                  <li key={f.storage_path} className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating angles…
              </>
            ) : "Generate angles →"}
          </button>
        </form>
      </main>
    </div>
  );
}
