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
    <div className="min-h-screen" style={{ background: "#f4f4f8" }}>
      <Stepper current="templates" projectId={projectId} />

      <main className="mx-auto max-w-5xl px-6 py-10">

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
              <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm0 8a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6zm12 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-6z" />
            </svg>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-indigo-500">Step 4 of 5</p>
            <h1 className="text-xl font-bold text-zinc-900">Pick a template</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Opens in the editor pre-filled with your copy and brand kit — change anything you like.
            </p>
          </div>
        </div>

        {/* Saved creatives */}
        {saved.length > 0 && (
          <div
            className="mb-6 relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)", animation: "fadeInUp 0.5s ease-out 0.05s backwards" }}
          >
            <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
              style={{ background: "linear-gradient(to bottom, #4f46e5, #7c3aed)" }} />
            <p className="mb-3 pl-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
              Saved creatives
            </p>
            <div className="flex flex-wrap gap-2.5">
              {saved.map((c) => (
                <Link
                  key={c.id}
                  href={`/project/${projectId}/editor/${c.id}`}
                  className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-sm"
                >
                  {c.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail_url} alt="" className="h-8 w-8 rounded-lg object-cover shadow-sm" />
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
          <div
            className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            style={{ animation: "fadeInUp 0.4s ease-out" }}
          >
            <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>
              No generated copy found for this session. Pick a template to use defaults, or{" "}
              <button onClick={() => router.push(`/project/${projectId}/angles`)} className="font-semibold underline">
                go back to choose an angle
              </button>{" "}
              first.
            </span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            style={{ animation: "scaleIn 0.3s ease-out" }}>
            <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Category tabs */}
        <div
          className="mb-6 flex flex-wrap gap-1.5"
          style={{ animation: "fadeInUp 0.5s ease-out 0.1s backwards" }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "text-white shadow-sm shadow-indigo-500/30"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:text-indigo-700"
              }`}
              style={activeCategory === cat
                ? { background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }
                : {}
              }
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template, i) => (
            <button
              key={template.key}
              onClick={() => pickTemplate(template)}
              disabled={pendingKey !== null}
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-left transition-all hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 disabled:opacity-60"
              style={{
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                animation: `fadeInUp 0.4s ease-out ${0.12 + i * 0.04}s backwards`,
              }}
            >
              <div className="pointer-events-none overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 transition-transform duration-300 group-hover:scale-[0.99]">
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
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="h-3 w-3 rounded-full border-2 border-indigo-500 border-t-transparent"
                        style={{ animation: "spin 0.8s linear infinite" }} />
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
