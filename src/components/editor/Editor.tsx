"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CanvasDef, CreativeState, Layer } from "@/lib/creative/types";
import type { ShapeLayer, TextLayer } from "@/lib/creative/types";
import {
  addLayer,
  deleteLayer,
  duplicateLayer,
  moveLayer,
  reorderLayer,
  toggleVisibility,
  updateLayer,
} from "@/lib/creative/mutations";
import { exportJpeg, exportPng, toPngDataUrl } from "@/lib/creative/export";
import { useHistory } from "./useHistory";
import { CreativeCanvas } from "./CreativeCanvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { LayersPanel } from "./LayersPanel";

interface Props {
  initialState: CreativeState;
  title?: string;
  projectId?: string;
  onSave?: (state: CreativeState, thumbnailDataUrl?: string) => Promise<void> | void;
  onRegenerateCopy?: (field: string) => Promise<string>;
}

export function Editor({ initialState, title = "Untitled", projectId, onSave, onRegenerateCopy }: Props) {
  const router = useRouter();
  const { state, setState, undo, redo, canUndo, canRedo } = useHistory(initialState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "save" | "png" | "jpg">(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const selected: Layer | null = state.layers.find((l) => l.id === selectedId) ?? null;

  const patchSelected = useCallback(
    (patch: Partial<Layer>) => {
      if (!selectedId) return;
      setState((s) => updateLayer(s, selectedId, patch));
    },
    [selectedId, setState],
  );

  const patchCanvas = useCallback(
    (patch: Partial<CanvasDef>) => {
      setState((s) => ({ ...s, canvas: { ...s.canvas, ...patch } }));
    },
    [setState],
  );

  const pickImageForSelected = useCallback(
    (file: File) => {
      if (!selectedId) return;
      const url = URL.createObjectURL(file);
      setState((s) => updateLayer(s, selectedId, { src: url } as Partial<Layer>));
    },
    [selectedId, setState],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      )
        return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (e.key === "Escape") { setSelectedId(null); setShowAddMenu(false); return; }
      if (!selectedId) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        setState((s) => deleteLayer(s, selectedId));
        setSelectedId(null);
        return;
      }
      if (mod && e.key === "d") {
        e.preventDefault();
        setState((s) => {
          const next = duplicateLayer(s, selectedId);
          const idx = next.layers.findIndex(
            (l) => l.id !== selectedId && l.x === (s.layers.find((x) => x.id === selectedId)?.x ?? 0) + 20,
          );
          if (idx !== -1) setTimeout(() => setSelectedId(next.layers[idx].id), 0);
          return next;
        });
        return;
      }

      const step = e.shiftKey ? 10 : 1;
      const arrows: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0],
        ArrowUp: [0, -step],   ArrowDown: [0, step],
      };
      const delta = arrows[e.key];
      if (delta) {
        e.preventDefault();
        setState((s) => {
          const layer = s.layers.find((l) => l.id === selectedId);
          if (!layer) return s;
          return moveLayer(s, selectedId, layer.x + delta[0], layer.y + delta[1]);
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, setState, undo, redo]);

  const addText = useCallback(() => {
    const id = `text-${Date.now()}`;
    const layer: TextLayer = {
      id, type: "text",
      x: 80, y: Math.round(state.canvas.height / 3),
      width: Math.min(600, state.canvas.width - 160), height: 100,
      rotation: 0, editable: true,
      content: "New text", fontFamily: "Inter",
      fontSize: 48, fontWeight: 600, color: "#111111",
      textAlign: "left", lineHeight: 1.2,
    };
    setState((s) => addLayer(s, layer));
    setSelectedId(id);
    setShowAddMenu(false);
  }, [state.canvas.height, state.canvas.width, setState]);

  const addShape = useCallback(() => {
    const id = `shape-${Date.now()}`;
    const layer: ShapeLayer = {
      id, type: "shape",
      x: 80, y: Math.round(state.canvas.height / 3),
      width: 300, height: 100, rotation: 0, editable: true,
      shape: "rectangle", radius: 8, fill: "#4f46e5",
    };
    setState((s) => addLayer(s, layer));
    setSelectedId(id);
    setShowAddMenu(false);
  }, [state.canvas.height, setState]);

  const handleExport = useCallback(
    async (format: "png" | "jpg") => {
      if (!captureRef.current) return;
      setBusy(format);
      try {
        const slug = title.replace(/\s+/g, "-").toLowerCase();
        if (format === "png") {
          await exportPng(captureRef.current, state.canvas.width, state.canvas.height, `${slug}.png`);
        } else {
          await exportJpeg(captureRef.current, state.canvas.width, state.canvas.height, `${slug}.jpg`);
        }
      } finally {
        setBusy(null);
      }
    },
    [state.canvas.width, state.canvas.height, title],
  );

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setBusy("save");
    try {
      let thumbnail: string | undefined;
      if (captureRef.current) {
        thumbnail = await toPngDataUrl(captureRef.current, state.canvas.width, state.canvas.height);
      }
      await onSave(state, thumbnail);
      router.push("/");
    } finally {
      setBusy(null);
    }
  }, [onSave, state, router]);

  return (
    <div className="flex h-full min-h-screen flex-col bg-zinc-950">
      {/* Toolbar */}
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Back */}
          <Link
            href={projectId ? `/project/${projectId}/templates` : "/"}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </Link>

          <div className="h-4 w-px bg-zinc-700" />

          <span className="text-xs font-medium text-zinc-300 max-w-[160px] truncate">{title}</span>

          <div className="h-4 w-px bg-zinc-700" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={undo}
              disabled={!canUndo || busy !== null}
              title="Undo (Ctrl+Z)"
              className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo || busy !== null}
              title="Redo (Ctrl+Shift+Z)"
              className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
              </svg>
            </button>
          </div>

          <div className="h-4 w-px bg-zinc-700" />

          {/* Add layer */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="5" y1="1" x2="5" y2="9" /><line x1="1" y1="5" x2="9" y2="5" />
              </svg>
              Add
            </button>
            {showAddMenu && (
              <div className="absolute left-0 top-full z-20 mt-1 flex min-w-[140px] flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800 shadow-xl">
                <button
                  onClick={addText}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-700 text-[11px] font-bold text-zinc-300">T</span>
                  Text layer
                </button>
                <button
                  onClick={addShape}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-700">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="1" y="1" width="8" height="8" rx="1" />
                    </svg>
                  </span>
                  Shape layer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {onSave && (
            <button
              onClick={handleSave}
              disabled={busy !== null}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700 disabled:opacity-50"
            >
              {busy === "save" ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              )}
              {busy === "save" ? "Saving…" : "Save & Exit"}
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport("png")}
              disabled={busy !== null}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy === "png" ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              {busy === "png" ? "Exporting…" : "Export PNG"}
            </button>
            <button
              onClick={() => handleExport("jpg")}
              disabled={busy !== null}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-700 disabled:opacity-50"
            >
              {busy === "jpg" ? "…" : "JPEG"}
            </button>
          </div>
        </div>
      </header>

      {/* Three-column body */}
      <div className="flex min-h-0 flex-1">
        {/* Layers panel */}
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-900">
          <LayersPanel
            state={state}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToggleVisibility={(id) => setState((s) => toggleVisibility(s, id))}
            onReorder={(id, dir) => setState((s) => reorderLayer(s, id, dir))}
            onDelete={(id) => {
              setState((s) => deleteLayer(s, id));
              if (selectedId === id) setSelectedId(null);
            }}
            onDuplicate={(id) => {
              setState((s) => {
                const next = duplicateLayer(s, id);
                const src = s.layers.find((l) => l.id === id);
                if (!src) return next;
                const copy = next.layers.find((l) => l.id !== id && l.x === src.x + 20 && l.y === src.y + 20);
                if (copy) setTimeout(() => setSelectedId(copy.id), 0);
                return next;
              });
            }}
          />
        </aside>

        {/* Canvas area */}
        <main
          className="flex flex-1 items-center justify-center overflow-auto p-8"
          style={{
            background: "#0d0d10",
            backgroundImage: "radial-gradient(circle, #27272a 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          onClick={() => setShowAddMenu(false)}
        >
          <CreativeCanvas
            ref={captureRef}
            state={state}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={setState}
            maxWidth={560}
          />
        </main>

        {/* Properties panel */}
        <aside className="w-64 shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-900">
          <PropertiesPanel
            layer={selected}
            canvas={state.canvas}
            onChangeCanvas={patchCanvas}
            onChange={patchSelected}
            onPickImage={pickImageForSelected}
            onRegenerateCopy={onRegenerateCopy}
          />
        </aside>
      </div>
    </div>
  );
}
