"use client";

// The editor shell: layers panel · live canvas · properties panel + toolbar.
// Owns the single CreativeState via useHistory (undo/redo stack).

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  onSave?: (
    state: CreativeState,
    thumbnailDataUrl?: string,
  ) => Promise<void> | void;
  onRegenerateCopy?: (field: string) => Promise<string>;
}

export function Editor({ initialState, title = "Untitled", projectId, onSave, onRegenerateCopy }: Props) {
  const { state, setState, undo, redo, canUndo, canRedo } =
    useHistory(initialState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "save" | "png" | "jpg">(null);
  const [saved, setSaved] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const selected: Layer | null =
    state.layers.find((l) => l.id === selectedId) ?? null;

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

  // --- Keyboard shortcuts -----------------------------------------------------
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

      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setShowAddMenu(false);
        return;
      }
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
          // Select the new layer (it appears right after selectedId)
          const idx = next.layers.findIndex(
            (l) =>
              l.id !== selectedId &&
              l.x === (s.layers.find((x) => x.id === selectedId)?.x ?? 0) + 20,
          );
          if (idx !== -1) setTimeout(() => setSelectedId(next.layers[idx].id), 0);
          return next;
        });
        return;
      }

      // Arrow key nudge: 1px, or 10px with Shift
      const step = e.shiftKey ? 10 : 1;
      const arrows: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
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

  // --- Add layer helpers ------------------------------------------------------
  const addText = useCallback(() => {
    const id = `text-${Date.now()}`;
    const layer: TextLayer = {
      id,
      type: "text",
      x: 80,
      y: Math.round(state.canvas.height / 3),
      width: Math.min(600, state.canvas.width - 160),
      height: 100,
      rotation: 0,
      editable: true,
      content: "New text",
      fontFamily: "Inter",
      fontSize: 48,
      fontWeight: 600,
      color: "#111111",
      textAlign: "left",
      lineHeight: 1.2,
    };
    setState((s) => addLayer(s, layer));
    setSelectedId(id);
    setShowAddMenu(false);
  }, [state.canvas.height, state.canvas.width, setState]);

  const addShape = useCallback(() => {
    const id = `shape-${Date.now()}`;
    const layer: ShapeLayer = {
      id,
      type: "shape",
      x: 80,
      y: Math.round(state.canvas.height / 3),
      width: 300,
      height: 100,
      rotation: 0,
      editable: true,
      shape: "rectangle",
      radius: 8,
      fill: "#2563EB",
    };
    setState((s) => addLayer(s, layer));
    setSelectedId(id);
    setShowAddMenu(false);
  }, [state.canvas.height, setState]);

  // --- Export / Save ----------------------------------------------------------
  const handleExport = useCallback(
    async (format: "png" | "jpg") => {
      if (!captureRef.current) return;
      setBusy(format);
      try {
        const slug = title.replace(/\s+/g, "-").toLowerCase();
        if (format === "png") {
          await exportPng(
            captureRef.current,
            state.canvas.width,
            state.canvas.height,
            `${slug}.png`,
          );
        } else {
          await exportJpeg(
            captureRef.current,
            state.canvas.width,
            state.canvas.height,
            `${slug}.jpg`,
          );
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
    setSaved(false);
    try {
      let thumbnail: string | undefined;
      if (captureRef.current) {
        thumbnail = await toPngDataUrl(
          captureRef.current,
          state.canvas.width,
          state.canvas.height,
        );
      }
      await onSave(state, thumbnail);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setBusy(null);
    }
  }, [onSave, state]);

  return (
    <div className="flex h-full min-h-screen flex-col bg-slate-50">
      {/* Toolbar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Back to dashboard */}
          <Link
            href={projectId ? `/project/${projectId}/templates` : "/"}
            className="flex items-center gap-1 rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            title="Back to project"
          >
            ← Back
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-sm font-medium text-slate-700">{title}</span>

          {/* Undo / Redo */}
          <div className="flex gap-1">
            <button
              onClick={undo}
              disabled={!canUndo || busy !== null}
              title="Undo (Ctrl+Z)"
              className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            >
              ↩
            </button>
            <button
              onClick={redo}
              disabled={!canRedo || busy !== null}
              title="Redo (Ctrl+Shift+Z)"
              className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            >
              ↪
            </button>
          </div>

          {/* Add layer dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu((v) => !v)}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50"
            >
              + Add
            </button>
            {showAddMenu && (
              <div className="absolute left-0 top-full z-10 mt-1 flex flex-col rounded-md border border-slate-200 bg-white py-1 shadow-md">
                <button
                  onClick={addText}
                  className="px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Text layer
                </button>
                <button
                  onClick={addShape}
                  className="px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Shape layer
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {onSave && (
            <button
              onClick={handleSave}
              disabled={busy !== null}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                saved
                  ? "border-green-400 bg-green-50 text-green-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {busy === "save" ? "Saving…" : saved ? "Saved ✓" : "Save"}
            </button>
          )}
          <button
            onClick={() => handleExport("png")}
            disabled={busy !== null}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy === "png" ? "Exporting…" : "Export PNG"}
          </button>
          <button
            onClick={() => handleExport("jpg")}
            disabled={busy !== null}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {busy === "jpg" ? "Exporting…" : "JPEG"}
          </button>
        </div>
      </header>

      {/* Body: three columns */}
      <div className="flex min-h-0 flex-1">
        <aside className="w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
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
                const copy = next.layers.find(
                  (l) => l.id !== id && l.x === src.x + 20 && l.y === src.y + 20,
                );
                if (copy) setTimeout(() => setSelectedId(copy.id), 0);
                return next;
              });
            }}
          />
        </aside>

        <main
          className="flex flex-1 items-center justify-center overflow-auto p-8"
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

        <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
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
