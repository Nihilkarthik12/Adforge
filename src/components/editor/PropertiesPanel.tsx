"use client";

// Right-hand panel: edit every property of the selected layer.
// When no layer is selected, shows canvas-level properties.

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-1.5 text-sm">
      <span className="shrink-0 text-xs text-slate-500">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20";

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
      <input
        type="color"
        className="h-7 w-8 cursor-pointer rounded border border-slate-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function RegenButton({
  field,
  onRegen,
}: {
  field: string;
  onRegen: (f: string) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        try {
          await onRegen(field);
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      title={`Regenerate ${field}`}
      className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
    >
      {busy ? "…" : "↺ Regen"}
    </button>
  );
}

export function PropertiesPanel({
  layer,
  canvas,
  onChangeCanvas,
  onChange,
  onPickImage,
  onRegenerateCopy,
}: Props) {
  if (!layer) {
    return (
      <div>
        <SectionLabel>Canvas</SectionLabel>
        <div className="px-4 pb-2 text-xs text-slate-400">
          {canvas.width} × {canvas.height} px
        </div>
        <Row label="Background">
          <ColorField
            value={canvas.background}
            onChange={(c) => onChangeCanvas({ background: c })}
          />
        </Row>
        <div className="mx-4 mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
          Select a layer to edit its properties.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-6">
      <SectionLabel>
        {layer.type} · {layer.id}
      </SectionLabel>

      {isText(layer) && (
        <>
          <div className="px-4 pb-2">
            {layer.bindsTo && onRegenerateCopy && (
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Bound to: <strong>{layer.bindsTo}</strong>
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
              className={inputCls + " resize-y"}
              rows={3}
              value={layer.content}
              onChange={(e) => onChange({ content: e.target.value } as Partial<Layer>)}
            />
          </div>

          <Row label="Font">
            <select
              className={inputCls}
              value={layer.fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value } as Partial<Layer>)}
            >
              {FONTS.map((f) => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </option>
              ))}
            </select>
          </Row>

          <Row label="Size">
            <NumberField
              value={layer.fontSize}
              onChange={(n) => onChange({ fontSize: n } as Partial<Layer>)}
            />
          </Row>

          <Row label="Weight">
            <select
              className={inputCls}
              value={layer.fontWeight}
              onChange={(e) => onChange({ fontWeight: Number(e.target.value) } as Partial<Layer>)}
            >
              {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </Row>

          <Row label="Color">
            <ColorField
              value={layer.color}
              onChange={(c) => onChange({ color: c } as Partial<Layer>)}
            />
          </Row>

          <Row label="Align">
            <div className="flex gap-1">
              {(["left", "center", "right"] as TextAlign[]).map((a) => (
                <button
                  key={a}
                  onClick={() => onChange({ textAlign: a } as Partial<Layer>)}
                  className={`flex-1 rounded border px-2 py-1 text-xs capitalize ${
                    layer.textAlign === a
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
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
              onChange={(e) =>
                onChange({ lineHeight: Number(e.target.value) } as Partial<Layer>)
              }
            />
          </Row>
        </>
      )}

      {isShape(layer) && (
        <Row label="Fill">
          <ColorField
            value={layer.fill}
            onChange={(c) => onChange({ fill: c } as Partial<Layer>)}
          />
        </Row>
      )}

      {isImage(layer) && (
        <div className="px-4 py-1.5">
          <label className="block cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-3 text-center text-xs text-slate-500 transition hover:border-blue-400 hover:bg-blue-50">
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
      )}

      <div className="mx-4 my-3 border-t border-slate-100" />
      <SectionLabel>Position &amp; Size</SectionLabel>
      <div className="grid grid-cols-2 gap-x-2">
        <Row label="X">
          <NumberField value={layer.x} onChange={(n) => onChange({ x: n } as Partial<Layer>)} />
        </Row>
        <Row label="Y">
          <NumberField value={layer.y} onChange={(n) => onChange({ y: n } as Partial<Layer>)} />
        </Row>
        <Row label="W">
          <NumberField
            value={layer.width}
            onChange={(n) => onChange({ width: n } as Partial<Layer>)}
          />
        </Row>
        <Row label="H">
          <NumberField
            value={layer.height}
            onChange={(n) => onChange({ height: n } as Partial<Layer>)}
          />
        </Row>
      </div>
    </div>
  );
}
