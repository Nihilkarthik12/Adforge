"use client";

// The renderer + on-canvas interaction surface.
//
// Structure (important for full-resolution export):
//   stage            -> measures available width, computes a fit scale
//     spacer         -> occupies the *scaled* footprint in layout
//       scaler       -> CSS transform: scale(s); everything visual lives here
//         captureNode (ref) -> TRUE pixel size (e.g. 1080x1080), NO transform.
//                              html-to-image captures THIS node => exports are full-res.
//         selection overlay -> handles/outline, sibling of captureNode so they
//                              are scaled with the view but excluded from export.
//
// Pointer math converts screen-space deltas back into canvas space by dividing
// by the active scale, so drag/resize stay accurate at any zoom.

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { CreativeState, Layer } from "@/lib/creative/types";
import { isImage, isShape, isText, isVisible } from "@/lib/creative/types";
import { moveLayer, resizeLayer, updateLayer } from "@/lib/creative/mutations";

type Corner = "nw" | "ne" | "sw" | "se";

interface Props {
  state: CreativeState;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (next: CreativeState) => void;
  /** Interactive editor surface vs. a static preview (thumbnails). */
  interactive?: boolean;
  /** Cap the rendered width; scale is derived from this and the canvas width. */
  maxWidth?: number;
}

/** Renders a single layer's visual content (no positioning — caller wraps it). */
function LayerContent({
  layer,
  editing,
  onCommitText,
}: {
  layer: Layer;
  editing: boolean;
  onCommitText?: (text: string) => void;
}) {
  if (isText(layer)) {
    return (
      <div
        contentEditable={editing}
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={(e) => onCommitText?.(e.currentTarget.textContent ?? "")}
        style={{
          width: "100%",
          height: "100%",
          fontFamily: layer.fontFamily,
          fontSize: layer.fontSize,
          fontWeight: layer.fontWeight,
          color: layer.color,
          textAlign: layer.textAlign,
          lineHeight: layer.lineHeight,
          outline: "none",
          overflowWrap: "break-word",
          whiteSpace: "pre-wrap",
          cursor: editing ? "text" : "inherit",
        }}
      >
        {layer.content}
      </div>
    );
  }
  if (isImage(layer)) {
    if (!layer.src) {
      // Empty image slots render transparent (NOT a placeholder) because the
      // editor canvas is also the export capture node — placeholder chrome
      // would end up inside exported PNGs. Find empty slots via the layers
      // panel or the selection outline.
      return <div style={{ width: "100%", height: "100%" }} />;
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={layer.src}
        alt=""
        crossOrigin="anonymous"
        style={{ width: "100%", height: "100%", objectFit: layer.objectFit }}
      />
    );
  }
  if (isShape(layer)) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: layer.fill,
          borderRadius:
            layer.shape === "ellipse" ? "50%" : (layer.radius ?? 0),
        }}
      />
    );
  }
  return null;
}

const HANDLES: Corner[] = ["nw", "ne", "sw", "se"];

export const CreativeCanvas = forwardRef<HTMLDivElement, Props>(
  function CreativeCanvas(
    {
      state,
      selectedId = null,
      onSelect,
      onChange,
      interactive = true,
      maxWidth = 600,
    },
    captureRef,
  ) {
    const { canvas, layers } = state;
    const stageRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(maxWidth / canvas.width);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);

    // Fit the canvas to the available stage width (capped by maxWidth).
    useLayoutEffect(() => {
      const el = stageRef.current;
      if (!el) return;
      const fit = () => {
        const avail = Math.min(el.clientWidth || maxWidth, maxWidth);
        setScale(avail / canvas.width);
      };
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(el);
      return () => ro.disconnect();
    }, [canvas.width, maxWidth]);

    // --- Pointer gesture (drag-move or corner-resize) -----------------------
    const gesture = useRef<{
      id: string;
      mode: "move" | Corner;
      startX: number;
      startY: number;
      orig: { x: number; y: number; width: number; height: number };
    } | null>(null);

    const beginGesture = useCallback(
      (
        e: React.PointerEvent,
        layer: Layer,
        mode: "move" | Corner,
      ) => {
        if (!interactive) return;
        e.stopPropagation();
        gesture.current = {
          id: layer.id,
          mode,
          startX: e.clientX,
          startY: e.clientY,
          orig: {
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height,
          },
        };
      },
      [interactive],
    );

    useEffect(() => {
      if (!interactive) return;
      const onMove = (e: PointerEvent) => {
        const g = gesture.current;
        if (!g || !onChange) return;
        const dx = (e.clientX - g.startX) / scale;
        const dy = (e.clientY - g.startY) / scale;
        if (g.mode === "move") {
          onChange(moveLayer(state, g.id, g.orig.x + dx, g.orig.y + dy));
          return;
        }
        // Corner resize: adjust the box per corner, keeping the opposite edge fixed.
        let { x, y, width, height } = g.orig;
        const right = g.orig.x + g.orig.width;
        const bottom = g.orig.y + g.orig.height;
        if (g.mode === "nw") {
          x = g.orig.x + dx;
          y = g.orig.y + dy;
          width = right - x;
          height = bottom - y;
        } else if (g.mode === "ne") {
          y = g.orig.y + dy;
          width = g.orig.width + dx;
          height = bottom - y;
        } else if (g.mode === "sw") {
          x = g.orig.x + dx;
          width = right - x;
          height = g.orig.height + dy;
        } else {
          width = g.orig.width + dx;
          height = g.orig.height + dy;
        }
        onChange(resizeLayer(state, g.id, { x, y, width, height }));
      };
      const onUp = () => {
        gesture.current = null;
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
    }, [interactive, onChange, scale, state]);

    const selected = layers.find((l) => l.id === selectedId) ?? null;

    return (
      <div
        ref={stageRef}
        style={{ width: "100%", maxWidth, userSelect: "none" }}
        onPointerDown={() => interactive && onSelect?.(null)}
      >
        {/* spacer reserves the scaled footprint in document flow */}
        <div
          style={{
            width: canvas.width * scale,
            height: canvas.height * scale,
            position: "relative",
          }}
        >
          {/* scaler: visual zoom for the whole view */}
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: canvas.width,
              height: canvas.height,
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            {/* captureNode: true-pixel creative — the export target */}
            <div
              ref={captureRef}
              style={{
                width: canvas.width,
                height: canvas.height,
                background: canvas.background,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {layers.filter(isVisible).map((layer) => {
                const editing = interactive && editingTextId === layer.id;
                return (
                  <div
                    key={layer.id}
                    onPointerDown={(e) => {
                      if (!interactive) return;
                      onSelect?.(layer.id);
                      if (!editing) beginGesture(e, layer, "move");
                    }}
                    onDoubleClick={() => {
                      if (interactive && isText(layer)) setEditingTextId(layer.id);
                    }}
                    style={{
                      position: "absolute",
                      left: layer.x,
                      top: layer.y,
                      width: layer.width,
                      height: layer.height,
                      transform: layer.rotation
                        ? `rotate(${layer.rotation}deg)`
                        : undefined,
                      cursor: interactive
                        ? editing
                          ? "text"
                          : "move"
                        : "default",
                    }}
                  >
                    <LayerContent
                      layer={layer}
                      editing={editing}
                      onCommitText={(text) => {
                        onChange?.(updateLayer(state, layer.id, { content: text }));
                        setEditingTextId(null);
                      }}
                    />
                    {/* The selection outline is drawn in the overlay below (a
                        sibling of the capture node) so it never taints exports. */}
                  </div>
                );
              })}
            </div>

            {/* selection overlay: sibling of capture node, excluded from export */}
            {interactive && selected && (
              <div
                style={{
                  position: "absolute",
                  left: selected.x,
                  top: selected.y,
                  width: selected.width,
                  height: selected.height,
                  border: "1.5px solid #2563eb",
                  boxSizing: "border-box",
                  pointerEvents: "none",
                }}
              >
                {HANDLES.map((corner) => {
                  const size = 12 / scale;
                  const pos: React.CSSProperties = { position: "absolute" };
                  if (corner.includes("n")) pos.top = -size / 2;
                  if (corner.includes("s")) pos.bottom = -size / 2;
                  if (corner.includes("w")) pos.left = -size / 2;
                  if (corner.includes("e")) pos.right = -size / 2;
                  return (
                    <div
                      key={corner}
                      onPointerDown={(e) => beginGesture(e, selected, corner)}
                      style={{
                        ...pos,
                        width: size,
                        height: size,
                        background: "#fff",
                        border: "1.5px solid #2563eb",
                        borderRadius: 2,
                        pointerEvents: "auto",
                        cursor:
                          corner === "nw" || corner === "se"
                            ? "nwse-resize"
                            : "nesw-resize",
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
