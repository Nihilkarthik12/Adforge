"use client";

// Left-hand panel: the layer stack. Array order = z-index (last = top),
// so we display it reversed to read top-to-bottom like other editors.

import type { CreativeState } from "@/lib/creative/types";
import { isVisible } from "@/lib/creative/types";

interface Props {
  state: CreativeState;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
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
    <div className="flex flex-col gap-1 p-3">
      <div className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Layers
      </div>
      {ordered.map((layer) => {
        const sel = layer.id === selectedId;
        return (
          <div
            key={layer.id}
            onClick={() => onSelect(layer.id)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm ${
              sel ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(layer.id);
              }}
              title={isVisible(layer) ? "Hide" : "Show"}
              className="shrink-0 text-slate-400 hover:text-slate-700"
            >
              {isVisible(layer) ? "👁" : "🚫"}
            </button>
            <span className="min-w-0 flex-1 truncate text-xs">{layer.id}</span>
            <div className="flex shrink-0 flex-col leading-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder(layer.id, "up");
                }}
                className="text-[10px] text-slate-400 hover:text-slate-700"
                title="Bring forward"
              >
                ▲
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder(layer.id, "down");
                }}
                className="text-[10px] text-slate-400 hover:text-slate-700"
                title="Send backward"
              >
                ▼
              </button>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(layer.id);
              }}
              title="Duplicate layer"
              className="shrink-0 text-[11px] text-slate-400 hover:text-blue-600"
            >
              ⧉
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(layer.id);
              }}
              title="Delete layer"
              className="shrink-0 text-[11px] text-slate-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
