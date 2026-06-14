"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/project/Stepper";
import { getBrandKit, saveBrandKit, signedUrl, uploadToBucket } from "@/lib/db";

const DEFAULTS = {
  color_primary: "#2563EB",
  color_secondary: "#1E293B",
  color_text: "#0F172A",
};

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
    getBrandKit(projectId)
      .then(async (kit) => {
        if (!kit) return;
        setPrimary(kit.color_primary);
        setSecondary(kit.color_secondary);
        setText(kit.color_text);
        setLogoPath(kit.logo_path);
        setBgPath(kit.bg_image_path);
        setLogoPreview(await signedUrl("assets", kit.logo_path));
        setBgPreview(await signedUrl("assets", kit.bg_image_path));
      })
      .catch(() => {});
  }, [projectId]);

  async function upload(
    file: File | undefined,
    setPath: (p: string) => void,
    setPreview: (u: string) => void,
  ) {
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
      await saveBrandKit(projectId, {
        logo_path: logoPath,
        color_primary: primary,
        color_secondary: secondary,
        color_text: text,
        bg_image_path: bgPath,
      });
      router.push(`/project/${projectId}/templates`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <Stepper current="brand" projectId={projectId} />
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Brand kit</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your logo and colors get poured into the template automatically.
          </p>
        </div>

        <form onSubmit={handleContinue} className="flex flex-col gap-6">
          {/* Logo */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="block text-sm font-semibold text-slate-700">Logo</span>
            <p className="mt-0.5 text-xs text-slate-400">Upload your brand logo (PNG or SVG recommended)</p>
            <div className="mt-4 flex items-center gap-4">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-14 w-auto max-w-[180px] rounded-lg border border-slate-200 bg-white object-contain p-2 shadow-sm"
                />
              ) : (
                <div className="flex h-14 w-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                  No logo
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => upload(e.target.files?.[0], setLogoPath, setLogoPreview)}
                className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="block text-sm font-semibold text-slate-700">Brand colors</span>
            <p className="mt-0.5 text-xs text-slate-400">These fill the template&apos;s color layers automatically</p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <ColorField label="Primary" value={primary} onChange={setPrimary} />
              <ColorField label="Secondary" value={secondary} onChange={setSecondary} />
              <ColorField label="Text" value={text} onChange={setText} />
            </div>
          </div>

          {/* Background image */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="block text-sm font-semibold text-slate-700">
              Background image{" "}
              <span className="text-xs font-normal text-slate-400">(optional)</span>
            </span>
            <div className="mt-4 flex items-center gap-4">
              {bgPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bgPreview}
                  alt="Background preview"
                  className="h-14 w-20 rounded-lg border border-slate-200 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-14 w-20 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                  None
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => upload(e.target.files?.[0], setBgPath, setBgPreview)}
                className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="self-start rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Choose a template →"}
          </button>
        </form>
      </main>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500">{label}</label>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-2 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-xs uppercase outline-none"
        />
      </div>
    </div>
  );
}
