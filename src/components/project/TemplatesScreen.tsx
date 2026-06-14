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
    return () => {
      active = false;
    };
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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <Stepper current="templates" projectId={projectId} />
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Pick a template</h1>
          <p className="mt-2 text-sm text-slate-500">
            Opens in the editor pre-filled with your copy and brand kit — change anything you like.
          </p>
        </div>

        {saved.length > 0 && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Saved creatives
            </h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {saved.map((c) => (
                <Link
                  key={c.id}
                  href={`/project/${projectId}/editor/${c.id}`}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                >
                  {c.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail_url} alt="" className="h-8 w-8 rounded object-cover" />
                  )}
                  <span>
                    {c.template_key}
                    <span className="ml-1.5 text-xs font-normal text-slate-400">
                      {new Date(c.updated_at).toLocaleDateString()}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!hasDraft && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Category filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeCategory === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <button
              key={template.key}
              onClick={() => pickTemplate(template)}
              disabled={pendingKey !== null}
              className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md disabled:opacity-60"
            >
              <div className="pointer-events-none overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                <CreativeCanvas
                  state={templateToState(template)}
                  interactive={false}
                  maxWidth={320}
                />
              </div>
              <div className="flex items-center justify-between px-1 pb-1">
                <div>
                  <div className="text-sm font-semibold text-slate-800">{template.name}</div>
                  <div className="text-xs text-slate-400">
                    {template.aspectRatio} · {template.style}
                  </div>
                </div>
                <span className="shrink-0 text-xs font-semibold text-blue-600 group-hover:underline">
                  {pendingKey === template.key ? (
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Opening…
                    </span>
                  ) : (
                    "Use →"
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
