// Pure, immutable update helpers for CreativeState.
// The editor holds one CreativeState in React state and routes every change through these.

import type { CreativeState, Layer } from "./types";

/** Replace one layer (matched by id) with a patched version. */
export function updateLayer(
  state: CreativeState,
  id: string,
  patch: Partial<Layer>,
): CreativeState {
  return {
    ...state,
    layers: state.layers.map((l) =>
      l.id === id ? ({ ...l, ...patch } as Layer) : l,
    ),
  };
}

/** Move a layer to an absolute position (used by drag). */
export function moveLayer(
  state: CreativeState,
  id: string,
  x: number,
  y: number,
): CreativeState {
  return updateLayer(state, id, { x: Math.round(x), y: Math.round(y) });
}

/** Resize + optionally reposition a layer (used by corner-handle resize). */
export function resizeLayer(
  state: CreativeState,
  id: string,
  box: { x: number; y: number; width: number; height: number },
): CreativeState {
  return updateLayer(state, id, {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.max(8, Math.round(box.width)),
    height: Math.max(8, Math.round(box.height)),
  });
}

/** Toggle a layer's visibility. */
export function toggleVisibility(
  state: CreativeState,
  id: string,
): CreativeState {
  return {
    ...state,
    layers: state.layers.map((l) =>
      l.id === id ? { ...l, visible: l.visible === false } : l,
    ),
  };
}

/** Move a layer up/down in the stacking order (array order = z-index). */
export function reorderLayer(
  state: CreativeState,
  id: string,
  direction: "up" | "down",
): CreativeState {
  const idx = state.layers.findIndex((l) => l.id === id);
  if (idx === -1) return state;
  const target = direction === "up" ? idx + 1 : idx - 1;
  if (target < 0 || target >= state.layers.length) return state;
  const layers = [...state.layers];
  [layers[idx], layers[target]] = [layers[target], layers[idx]];
  return { ...state, layers };
}

export function getLayer(state: CreativeState, id: string): Layer | undefined {
  return state.layers.find((l) => l.id === id);
}

/** Remove a layer by id. */
export function deleteLayer(state: CreativeState, id: string): CreativeState {
  return { ...state, layers: state.layers.filter((l) => l.id !== id) };
}

/** Duplicate a layer with a fresh id, offset by 20px so it's visible. */
export function duplicateLayer(state: CreativeState, id: string): CreativeState {
  const src = state.layers.find((l) => l.id === id);
  if (!src) return state;
  const copy: Layer = {
    ...src,
    id: `${src.type}-${Date.now()}`,
    x: src.x + 20,
    y: src.y + 20,
  };
  const idx = state.layers.findIndex((l) => l.id === id);
  const layers = [...state.layers];
  layers.splice(idx + 1, 0, copy);
  return { ...state, layers };
}

/** Append a new layer on top of the stack (highest z-index). */
export function addLayer(state: CreativeState, layer: Layer): CreativeState {
  return { ...state, layers: [...state.layers, layer] };
}
