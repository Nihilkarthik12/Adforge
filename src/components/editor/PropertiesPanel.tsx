"use client";

import { useState } from "react";
import type { CanvasDef, Layer, TextAlign } from "@/lib/creative/types";
import { isImage, isShape, isText } from "@/lib/creative/types";

const FONTS = [
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Playfair Display", value: "Playfair Display, serif" },
  { label: "Raleway", value: "Raleway, sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Nunito", value: "Nunito, sans-serif" },
  { label: "Space Grotesk", value: "Space Grotesk, sans-serif" },
];

interface Props {
  layer: Layer | null;
  canvas: CanvasDef;
  onChangeCanvas: (patch: Partial<CanvasDef>) => void;
  onChange: (patch: Partial<Layer>) => void;
  onPickImage?: (file: File) => void;
  onRegenerateCopy?: (field: string) => Promise<string>;
}

const panelCls = "flex flex-col";

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{children}</span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5">
      <span className="shrink-0 text-[11px] text-zinc-500 w-12">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30";

const selectCls =
  "w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30";

function NumberField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      className={inputCls}
      value={Math.round(value)}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-6 w-7 shrink-0 overflow-hidden rounded border border-zinc-700 shadow-sm">
        <input
          type="color"
          className="absolute -inset-1 h-9 w-9 cursor-pointer border-0 bg-transparent p-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <input
        type="text"
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function RegenButton({ field, onRegen }: { field: string; onRegen: (f: string) => Promise<string> }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        try { await onRegen(field); } finally { setBusy(false); }
      }}
      disabled={busy}
      title={`Regenerate ${field}`}
      className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 transition hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-400 disabled:opacity-50"
    >
      {busy ? (
        <span className="h-2.5 w-2.5 animate-spin rounded-full border border-zinc-400 border-t-transparent" />
      ) : (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 .49-4.33" />
        </svg>
      )}
      Regen
    </button>
  );
}

export function PropertiesPanel({ layer, canvas, onChangeCanvas, onChange, onPickImage, onRegenerateCopy }: Props) {
  if (!layer) {
    return (
      <div className={panelCls}>
        <SectionHeader>Canvas</SectionHeader>
        <div className="px-3 py-2 text-[11px] text-zinc-500">
          {canvas.width} × {canvas.height} px
        </div>
        <Row label="BG">
          <ColorField value={canvas.background} onChange={(c) => onChangeCanvas({ background: c })} />
        </Row>
        <div className="mx-3 mt-4 border-t border-zinc-800 pt-4 text-[11px] text-zinc-600">
          Select a layer to edit its properties.
        </div>
      </div>
    );
  }

  return (
    <div className={panelCls}>
      <SectionHeader>
        {isText(layer) ? "Text" : isShape(layer) ? "Shape" : "Image"}
      </SectionHeader>

      {isText(layer) && (
        <>
          {/* Content */}
          <div className="border-b border-zinc-800 px-3 py-3">
            {layer.bindsTo && onRegenerateCopy && (
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">
                  Bound: <span className="font-semibold text-zinc-400">{layer.bindsTo}</span>
                </span>
                <RegenButton
                  field={layer.bindsTo}
                  onRegen={async (f) => {
                    const text = await onRegenerateCopy(f);
                    if (text) onChange({ content: text } as Partial<Layer>);
                    return text;
                  }}
                />
              </div>
            )}
            <textarea
              className={inputCls + " resize-y min-h-[72px]"}
              rows={3}
              value={layer.content}
              onChange={(e) => onChange({ content: e.target.value } as Partial<Layer>)}
            />
          </div>

          {/* Typography */}
          <SectionHeader>Typography</SectionHeader>
          <Row label="Font">
            <select
              className={selectCls}
              value={layer.fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value } as Partial<Layer>)}
            >
              {FONTS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </Row>
          <Row label="Size">
            <NumberField value={layer.fontSize} onChange={(n) => onChange({ fontSize: n } as Partial<Layer>)} />
          </Row>
          <Row label="Weight">
            <select
              className={selectCls}
              value={layer.fontWeight}
              onChange={(e) => onChange({ fontWeight: Number(e.target.value) } as Partial<Layer>)}
            >
              {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </Row>
          <Row label="Color">
            <ColorField value={layer.color} onChange={(c) => onChange({ color: c } as Partial<Layer>)} />
          </Row>
          <Row label="Align">
            <div className="flex gap-1">
              {(["left", "center", "right"] as TextAlign[]).map((a) => (
                <button
                  key={a}
                  onClick={() => onChange({ textAlign: a } as Partial<Layer>)}
                  className={`flex-1 rounded border py-1 text-[10px] font-medium capitalize transition ${
                    layer.textAlign === a
                      ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                      : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Line h.">
            <input
              type="number"
              step="0.1"
              className={inputCls}
              value={layer.lineHeight}
              onChange={(e) => onChange({ lineHeight: Number(e.target.value) } as Partial<Layer>)}
            />
          </Row>
        </>
      )}

      {isShape(layer) && (
        <>
          <SectionHeader>Style</SectionHeader>
          <Row label="Fill">
            <ColorField value={layer.fill} onChange={(c) => onChange({ fill: c } as Partial<Layer>)} />
          </Row>
          {layer.radius !== undefined && (
            <Row label="Radius">
              <NumberField value={layer.radius} onChange={(n) => onChange({ radius: n } as Partial<Layer>)} />
            </Row>
          )}
        </>
      )}

      {isImage(layer) && (
        <>
          <SectionHeader>Image</SectionHeader>
          <div className="px-3 py-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 px-3 py-3 text-center text-xs text-zinc-500 transition hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-indigo-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {layer.src ? "Replace image" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickImage?.(f);
                }}
              />
            </label>
          </div>
        </>
      )}

      {/* Position & Size */}
      <div className="border-t border-zinc-800">
        <SectionHeader>Position &amp; Size</SectionHeader>
        <div className="grid grid-cols-2">
          <Row label="X"><NumberField value={layer.x} onChange={(n) => onChange({ x: n } as Partial<Layer>)} /></Row>
          <Row label="Y"><NumberField value={layer.y} onChange={(n) => onChange({ y: n } as Partial<Layer>)} /></Row>
          <Row label="W"><NumberField value={layer.width} onChange={(n) => onChange({ width: n } as Partial<Layer>)} /></Row>
          <Row label="H"><NumberField value={layer.height} onChange={(n) => onChange({ height: n } as Partial<Layer>)} /></Row>
        </div>
      </div>
    </div>
  );
}
