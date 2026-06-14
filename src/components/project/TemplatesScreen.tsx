"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stepper } from "@/components/project/Stepper";
import { CreativeCanvas } from "@/components/editor/CreativeCanvas";
import {
  templates,
  templateToState,
  type TemplateDef,
} from "@/lib/creative/templates";
import { autofill } from "@/lib/creative/autofill";
import {
  clearDraftCopy,
  createCreative,
  getBrandKit,
  getDraftCopy,
  listCreatives,
  signedUrl,
  type Creative,
} from "@/lib/db";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  hero: "Hero",
  minimal: "Minimal",
  testimonial: "Testimonial",
  solution: "Problem / Solution",
  feature: "Feature",
  portrait: "Portrait",
  linkedin: "LinkedIn",
  story: "Instagram Story",
};

export function TemplatesScreen({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(true);
  const [saved, setSaved] = useState<Creative[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      const draft = Boolean(getDraftCopy(projectId));
      const creatives = await listCreatives(projectId).catch(() => []);
      if (!active) return;
      setHasDraft(draft);
      setSaved(creatives);
    })();
    return () => { active = false; };
  }, [projectId]);

  const categories = ["all", ...Array.from(new Set(templates.map((t) => t.category)))];
  const filtered =
    activeCategory === "all"
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  async function pickTemplate(template: TemplateDef) {
    setPendingKey(template.key);
    setError(null);
    try {
      const draft = getDraftCopy(projectId);
      const kit = await getBrandKit(projectId);
      let state = templateToState(template);

      if (draft || kit) {
        const [logoSrc, bgImageSrc] = await Promise.all([
          signedUrl("assets", kit?.logo_path ?? null),
          signedUrl("assets", kit?.bg_image_path ?? null),
        ]);
        state = autofill(
          state,
          draft?.copy ?? { headline: "", subheadline: "", body: "", cta: "" },
          {
            logoSrc,
            colorPrimary: kit?.color_primary ?? "",
            colorSecondary: kit?.color_secondary ?? "",
            colorText: kit?.color_text ?? "",
            bgImageSrc,
            logoPath: kit?.logo_path ?? null,
            bgImagePath: kit?.bg_image_path ?? null,
          },
        );
      }

      const creative = await createCreative({
        project_id: projectId,
        angle_id: draft?.angleId ?? null,
        template_key: template.key,
        state_json: state,
      });

      clearDraftCopy(projectId);
      router.push(`/project/${projectId}/editor/${creative.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPendingKey(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur-md px-6 py-3.5 shadow-sm">
        <Stepper current="templates" projectId={projectId} />
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-500">Step 4 of 5</p>
          <h1 className="text-2xl font-bold text-zinc-900">Pick a template</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Opens in the editor pre-filled with your copy and brand kit — change anything you like.
          </p>
        </div>

        {/* Saved creatives */}
        {saved.length > 0 && (
          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Saved creatives
            </p>
            <div className="flex flex-wrap gap-2.5">
              {saved.map((c) => (
                <Link
                  key={c.id}
                  href={`/project/${projectId}/editor/${c.id}`}
                  className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {c.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail_url} alt="" className="h-8 w-8 rounded object-cover" />
                  )}
                  <span>
                    {c.template_key}
                    <span className="ml-1.5 text-xs font-normal text-zinc-400">
                      {new Date(c.updated_at).toLocaleDateString()}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!hasDraft && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No generated copy found for this session. Pick a template to use defaults, or{" "}
            <button
              onClick={() => router.push(`/project/${projectId}/angles`)}
              className="font-semibold underline"
            >
              go back to choose an angle
            </button>{" "}
            first.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Category tabs */}
        <div className="mb-6 flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:text-indigo-700"
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <button
              key={template.key}
              onClick={() => pickTemplate(template)}
              disabled={pendingKey !== null}
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60"
            >
              <div className="pointer-events-none overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                <CreativeCanvas
                  state={templateToState(template)}
                  interactive={false}
                  maxWidth={320}
                />
              </div>
              <div className="flex items-center justify-between px-1 pb-1">
                <div>
                  <p className="text-sm font-semibold text-zinc-800">{template.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {template.aspectRatio} · {template.style}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-indigo-600">
                  {pendingKey === template.key ? (
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      Opening…
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 group-hover:underline">
                      Use
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  )}
                </span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
