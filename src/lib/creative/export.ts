// Rasterization. The capture node is at true pixel size, so exports are full-res
// regardless of on-screen zoom (spec §10 export rule).

import { toJpeg, toPng } from "html-to-image";

/** Render the capture node to a PNG data URL at full canvas resolution. */
export async function toPngDataUrl(
  node: HTMLElement,
  width: number,
  height: number,
): Promise<string> {
  return toPng(node, {
    width,
    height,
    pixelRatio: 1,
    cacheBust: true,
    // The node has no transform of its own; render it at its natural size.
    style: { transform: "none", transformOrigin: "top left" },
  });
}

function download(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/** Trigger a browser download of the creative as a PNG. */
export async function exportPng(
  node: HTMLElement,
  width: number,
  height: number,
  filename = "adforge-creative.png",
): Promise<void> {
  const dataUrl = await toPngDataUrl(node, width, height);
  download(dataUrl, filename);
}

/** Trigger a browser download of the creative as a JPEG. */
export async function exportJpeg(
  node: HTMLElement,
  width: number,
  height: number,
  filename = "adforge-creative.jpg",
): Promise<void> {
  const dataUrl = await toJpeg(node, {
    width,
    height,
    pixelRatio: 1,
    cacheBust: true,
    quality: 0.92,
    style: { transform: "none", transformOrigin: "top left" },
  });
  download(dataUrl, filename);
}

/** Convert a PNG data URL to a Blob (for uploading thumbnails to storage). */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/**
 * Phase 2 feature, intentionally unimplemented in V1 (spec §5).
 * Kept as a clearly-marked stub so the call site exists for the future.
 */
export function exportToCanva(): never {
  // SPEC-NOTE: Canva export is deferred to Phase 2; see spec §5 / §12.
  throw new Error("exportToCanva: not implemented in V1");
}
