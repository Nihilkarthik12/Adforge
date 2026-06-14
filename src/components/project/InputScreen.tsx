"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/project/Stepper";
import { getInput, replaceAngles, saveInput, uploadToBucket } from "@/lib/db";

interface PickedFile {
  name: string;
  storage_path: string;
  text: string;
}

export function InputScreen({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [businessText, setBusinessText] = useState("");
  const [competitorText, setCompetitorText] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInput(projectId)
      .then((row) => {
        if (row) {
          setBusinessText(row.business_text ?? "");
          setCompetitorText(row.competitor_text ?? "");
        }
      })
      .catch(() => {});
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
    if (!businessText.trim()) {
      setError("Business info is required.");
      return;
    }
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
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <Stepper current="input" projectId={projectId} />
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Tell us about the product</h1>
          <p className="mt-2 text-sm text-slate-500">
            We&apos;ll read this and extract distinct marketing angles for your ad.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700">
              Business info <span className="text-red-500">*</span>
            </label>
            <p className="mt-0.5 text-xs text-slate-400">
              What does the product do? Who is it for? What makes it different?
            </p>
            <textarea
              required
              value={businessText}
              onChange={(e) => setBusinessText(e.target.value)}
              rows={7}
              placeholder="e.g. We build an AI tool that helps B2B SaaS companies create ad creatives in minutes…"
              className="mt-3 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700">
              Competitor ad text{" "}
              <span className="text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <p className="mt-0.5 text-xs text-slate-400">
              Paste transcripts of competitor ads to help generate stronger angles.
            </p>
            <textarea
              value={competitorText}
              onChange={(e) => setCompetitorText(e.target.value)}
              rows={4}
              placeholder="Paste competitor ad copy here…"
              className="mt-3 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700">
              Documents{" "}
              <span className="text-xs font-normal text-slate-400">(optional — .txt, .md, .pdf)</span>
            </label>
            <input
              type="file"
              multiple
              accept=".txt,.md,.pdf"
              onChange={(e) => handleFiles(e.target.files)}
              className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
            />
            {files.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1">
                {files.map((f) => (
                  <li key={f.storage_path} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="self-start rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Generating angles…" : "Generate angles →"}
          </button>
        </form>
      </main>
    </div>
  );
}
