"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/project/Stepper";
import { getBrandKit, saveBrandKit, signedUrl, uploadToBucket } from "@/lib/db";

const DEFAULTS = { color_primary: "#4f46e5", color_secondary: "#1E293B", color_text: "#0F172A" };

export function BrandScreen({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [primary, setPrimary] = useState(DEFAULTS.color_primary);
  const [secondary, setSecondary] = useState(DEFAULTS.color_secondary);
  const [text, setText] = useState(DEFAULTS.color_text);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bgPath, setBgPath] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBrandKit(projectId).then(async (kit) => {
      if (!kit) return;
      setPrimary(kit.color_primary);
      setSecondary(kit.color_secondary);
      setText(kit.color_text);
      setLogoPath(kit.logo_path);
      setBgPath(kit.bg_image_path);
      setLogoPreview(await signedUrl("assets", kit.logo_path));
      setBgPreview(await signedUrl("assets", kit.bg_image_path));
    }).catch(() => {});
  }, [projectId]);

  async function upload(file: File | undefined, setPath: (p: string) => void, setPreview: (u: string) => void) {
    if (!file) return;
    setError(null);
    try {
      const path = await uploadToBucket("assets", projectId, file, file.name);
      setPath(path);
      setPreview(URL.createObjectURL(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await saveBrandKit(projectId, { logo_path: logoPath, color_primary: primary, color_secondary: secondary, color_text: text, bg_image_path: bgPath });
      router.push(`/project/${projectId}/templates`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-md px-6 py-3.5">
        <Stepper current="brand" projectId={projectId} />
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-500">Step 3 of 5</p>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Set up your brand kit</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Your logo and colors will be applied to the template automatically.
          </p>
        </div>

        <form onSubmit={handleContinue} className="flex flex-col gap-4">
          {/* Logo */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Logo</p>
                <p className="mt-0.5 text-xs text-zinc-400">PNG or SVG recommended for best quality</p>
              </div>
              {logoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-12 w-auto max-w-[140px] rounded-lg border border-zinc-200 bg-white object-contain p-2 shadow-sm"
                />
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3.5 text-sm transition hover:border-indigo-400 hover:bg-indigo-50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-zinc-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-700">{logoPreview ? "Replace logo" : "Upload logo"}</p>
                <p className="text-xs text-zinc-400">PNG, SVG, JPG</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], setLogoPath, setLogoPreview)} />
            </label>
          </div>

          {/* Colors */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-1 text-sm font-semibold text-zinc-900">Brand colors</p>
            <p className="mb-5 text-xs text-zinc-400">These automatically fill the template&apos;s color layers</p>
            <div className="grid grid-cols-3 gap-4">
              <ColorField label="Primary" value={primary} onChange={setPrimary} />
              <ColorField label="Secondary" value={secondary} onChange={setSecondary} />
              <ColorField label="Text" value={text} onChange={setText} />
            </div>

            {/* Color preview */}
            <div className="mt-5 flex gap-2">
              <div className="h-8 flex-1 rounded-lg shadow-sm" style={{ backgroundColor: primary }} title="Primary" />
              <div className="h-8 flex-1 rounded-lg shadow-sm" style={{ backgroundColor: secondary }} title="Secondary" />
              <div className="h-8 flex-1 rounded-lg border border-zinc-100 shadow-sm" style={{ backgroundColor: text }} title="Text" />
            </div>
          </div>

          {/* Background image */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900">Background image</p>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-400">Optional</span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-400">Used in templates with a background layer</p>
              </div>
              {bgPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bgPreview} alt="Background preview" className="h-12 w-20 rounded-lg border border-zinc-200 object-cover shadow-sm" />
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3.5 text-sm transition hover:border-indigo-400 hover:bg-indigo-50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-zinc-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-700">{bgPreview ? "Replace background" : "Upload background"}</p>
                <p className="text-xs text-zinc-400">PNG, JPG, WEBP</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], setBgPath, setBgPreview)} />
            </label>
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
            className="flex items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving…
              </>
            ) : (
              <>
                Choose a template
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-zinc-500">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
        <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded border border-zinc-300 shadow-sm">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-1 h-8 w-8 cursor-pointer border-0 bg-transparent p-0"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-xs font-mono uppercase text-zinc-700 outline-none"
        />
      </div>
    </div>
  );
}
