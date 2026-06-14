"use client";

import type { CreativeState, Layer } from "@/lib/creative/types";
import { isImage, isShape, isText, isVisible } from "@/lib/creative/types";

interface Props {
  state: CreativeState;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const BIND_LABELS: Record<string, string> = {
  headline: "Headline",
  subheadline: "Subheadline",
  body: "Body",
  cta: "CTA",
  logo: "Logo",
  color_primary: "Primary color",
  color_secondary: "Secondary",
  color_text: "Text color",
  bg_image: "Background",
};

function layerLabel(layer: Layer): string {
  if (layer.bindsTo) return BIND_LABELS[layer.bindsTo] ?? layer.bindsTo;
  return layer.id
    .replace(/[-_]/g, " ")
    .replace(/\d{6,}/g, "")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || layer.id;
}

function LayerIcon({ layer }: { layer: Layer }) {
  if (isText(layer)) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
        T
      </span>
    );
  }
  if (isShape(layer)) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-500/20">
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <rect x="0.5" y="0.5" width="8" height="8" rx="1" fill="#a78bfa" opacity="0.8" />
        </svg>
      </span>
    );
  }
  if (isImage(layer)) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/20">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-700">
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
        <circle cx="4.5" cy="4.5" r="3" fill="#71717a" />
      </svg>
    </span>
  );
}

export function LayersPanel({
  state,
  selectedId,
  onSelect,
  onToggleVisibility,
  onReorder,
  onDelete,
  onDuplicate,
}: Props) {
  const ordered = [...state.layers].reverse();

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Layers</span>
        <span className="text-[10px] text-zinc-600">{state.layers.length}</span>
      </div>

      <div className="flex flex-col gap-0.5 p-2">
        {ordered.map((layer) => {
          const sel = layer.id === selectedId;
          const visible = isVisible(layer);
          return (
            <div
              key={layer.id}
              onClick={() => onSelect(layer.id)}
              className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition ${
                sel
                  ? "bg-indigo-600/20 ring-1 ring-indigo-500/30"
                  : "hover:bg-zinc-800"
              }`}
            >
              {/* Type icon */}
              <LayerIcon layer={layer} />

              {/* Label */}
              <span className={`min-w-0 flex-1 truncate text-[11px] font-medium ${
                sel ? "text-indigo-300" : "text-zinc-300"
              }`}>
                {layerLabel(layer)}
              </span>

              {/* Actions (visible on hover/select) */}
              <div className={`flex shrink-0 items-center gap-0.5 ${sel ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                {/* Visibility toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                  title={visible ? "Hide" : "Show"}
                  className="rounded p-1 text-zinc-500 transition hover:bg-zinc-700 hover:text-zinc-200"
                >
                  {visible ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>

                {/* Reorder up */}
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(layer.id, "up"); }}
                  title="Bring forward"
                  className="rounded p-1 text-zinc-500 transition hover:bg-zinc-700 hover:text-zinc-200"
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="1.5 5.5 4.5 2.5 7.5 5.5" />
                  </svg>
                </button>

                {/* Reorder down */}
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(layer.id, "down"); }}
                  title="Send backward"
                  className="rounded p-1 text-zinc-500 transition hover:bg-zinc-700 hover:text-zinc-200"
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="1.5 3.5 4.5 6.5 7.5 3.5" />
                  </svg>
                </button>

                {/* Duplicate */}
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicate(layer.id); }}
                  title="Duplicate"
                  className="rounded p-1 text-zinc-500 transition hover:bg-zinc-700 hover:text-zinc-200"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}
                  title="Delete"
                  className="rounded p-1 text-zinc-600 transition hover:bg-red-500/20 hover:text-red-400"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
