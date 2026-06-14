// The central data structure of AdForge (spec §7).
// The renderer draws it, the editor mutates it, export rasterizes it, auto-fill populates it.
// This single format is what makes every creative 100% editable.

/** Which AI copy / brand field a layer is auto-filled from. */
export type BindKey =
  | "headline"
  | "subheadline"
  | "body"
  | "cta"
  | "logo"
  | "color_primary"
  | "color_secondary"
  | "color_text";

export type LayerType = "text" | "image" | "shape";
export type TextAlign = "left" | "center" | "right";
export type ObjectFit = "contain" | "cover";
export type ShapeKind = "rectangle" | "ellipse";

export interface CanvasDef {
  width: number;
  height: number;
  background: string;
}

/** Fields shared by every layer. */
export interface BaseLayer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  editable: boolean;
  /** Defaults to true when absent; toggled from the layers panel. */
  visible?: boolean;
  /** Maps this layer to an AI copy / brand field for auto-fill. */
  bindsTo?: BindKey;
}

export interface TextLayer extends BaseLayer {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  textAlign: TextAlign;
  lineHeight: number;
}

export interface ImageLayer extends BaseLayer {
  type: "image";
  /** Filled from brand_kit.logo_path / bg image; null until provided. */
  src: string | null;
  /**
   * SPEC-NOTE: signed URLs in `src` expire; when the image came from Supabase
   * Storage we also persist its storage path so reopening a saved creative
   * can mint a fresh signed URL.
   */
  srcPath?: string | null;
  objectFit: ObjectFit;
}

export interface ShapeLayer extends BaseLayer {
  type: "shape";
  shape: ShapeKind;
  /** Corner radius for rectangles. */
  radius?: number;
  fill: string;
}

export type Layer = TextLayer | ImageLayer | ShapeLayer;

export interface CreativeState {
  canvas: CanvasDef;
  layers: Layer[];
}

/** AI-generated copy returned by /api/copy (spec §8 Step B). */
export interface CopyFields {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
}

/** A marketing angle returned by /api/angles (spec §8 Step A). */
export interface Angle {
  name: string;
  core_message: string;
  hook: string;
  cta: string;
}

/** The default copy fields a template is filled from (spec §8 Step B input). */
export const COPY_FIELDS = ["headline", "subheadline", "body", "cta"] as const;

/** Brand inputs collected on the Brand Kit screen (spec §6 brand_kits). */
export interface BrandKit {
  logoSrc: string | null;
  colorPrimary: string;
  colorSecondary: string;
  colorText: string;
  bgImageSrc: string | null;
}

/** Narrowing helpers — handy in the renderer/editor switch logic. */
export const isText = (l: Layer): l is TextLayer => l.type === "text";
export const isImage = (l: Layer): l is ImageLayer => l.type === "image";
export const isShape = (l: Layer): l is ShapeLayer => l.type === "shape";

/** A layer is visible unless explicitly hidden. */
export const isVisible = (l: Layer): boolean => l.visible !== false;
