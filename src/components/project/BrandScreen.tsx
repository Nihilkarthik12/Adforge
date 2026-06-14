"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/project/Stepper";
import { getBrandKit, saveBrandKit, signedUrl, uploadToBucket } from "@/lib/db";

const DEFAULTS = { color_primary: "#2563EB", color_secondary: "#1E293B", color_text: "#0F172A" };

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
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-3.5">
        <Stepper current="brand" projectId={projectId} />
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Set up your brand kit</h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Your logo and colors will be applied to the template automatically.
          </p>
        </div>

        <form onSubmit={handleContinue} className="flex flex-col gap-5">
          {/* Logo */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Logo</p>
                <p className="text-xs text-slate-400 mt-0.5">PNG or SVG recommended for best quality</p>
              </div>
              {logoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo" className="h-10 w-auto max-w-[120px] rounded-lg border border-slate-200 bg-white object-contain p-1.5 shadow-sm" />
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm transition hover:border-blue-400 hover:bg-blue-50">
              <span className="text-lg">🖼</span>
              <span className="text-slate-600 font-medium">{logoPreview ? "Replace logo" : "Upload logo"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], setLogoPath, setLogoPreview)} />
            </label>
          </div>

          {/* Colors */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-800 mb-1">Brand colors</p>
            <p className="text-xs text-slate-400 mb-5">These automatically fill the template&apos;s color layers</p>
            <div className="grid grid-cols-3 gap-4">
              <ColorField label="Primary" value={primary} onChange={setPrimary} />
              <ColorField label="Secondary" value={secondary} onChange={setSecondary} />
              <ColorField label="Text" value={text} onChange={setText} />
            </div>
          </div>

          {/* Background image */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">Background image</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">Optional</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Used in templates with a background layer</p>
              </div>
              {bgPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bgPreview} alt="Background" className="h-10 w-16 rounded-lg border border-slate-200 object-cover shadow-sm" />
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm transition hover:border-blue-400 hover:bg-blue-50">
              <span className="text-lg">🌄</span>
              <span className="text-slate-600 font-medium">{bgPreview ? "Replace image" : "Upload background"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], setBgPath, setBgPreview)} />
            </label>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving…</>
            ) : "Choose a template →"}
          </button>
        </form>
      </main>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-2">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0 shadow-sm" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-xs uppercase text-slate-700 outline-none" />
      </div>
    </div>
  );
}
