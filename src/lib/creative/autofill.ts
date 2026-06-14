// Auto-fill (spec §7): walk a template's layers and pour AI copy + brand kit
// into them via each layer's `bindsTo`. The user can override everything in
// the editor afterwards.

import type {
  BrandKit,
  CopyFields,
  CreativeState,
  Layer,
} from "./types";
import { isImage, isShape, isText } from "./types";

export interface BrandFill extends BrandKit {
  /** Storage paths kept alongside signed URLs so reopening can re-sign. */
  logoPath?: string | null;
  bgImagePath?: string | null;
}

export function autofill(
  state: CreativeState,
  copy: CopyFields,
  brand: BrandFill,
): CreativeState {
  const layers = state.layers.map((layer): Layer => {
    const next = { ...layer } as Layer;

    if (isText(next)) {
      if (next.bindsTo === "headline") next.content = copy.headline;
      if (next.bindsTo === "subheadline") next.content = copy.subheadline;
      if (next.bindsTo === "body") next.content = copy.body;
      if (next.bindsTo === "cta") next.content = copy.cta;
      if (next.bindsTo === "color_text" && brand.colorText)
        next.color = brand.colorText;
    }

    if (isShape(next)) {
      if (next.bindsTo === "color_primary" && brand.colorPrimary)
        next.fill = brand.colorPrimary;
      if (next.bindsTo === "color_secondary" && brand.colorSecondary)
        next.fill = brand.colorSecondary;
    }

    if (isImage(next)) {
      if (next.bindsTo === "logo" && brand.logoSrc) {
        next.src = brand.logoSrc;
        next.srcPath = brand.logoPath ?? null;
      }
      // SPEC-NOTE: bindsTo has no key for background images, so templates use
      // the layer id convention "bg_image"; filled from the brand kit's
      // optional background upload.
      if (next.id === "bg_image" && brand.bgImageSrc) {
        next.src = brand.bgImageSrc;
        next.srcPath = brand.bgImagePath ?? null;
      }
    }

    return next;
  });

  return { ...state, layers };
}
