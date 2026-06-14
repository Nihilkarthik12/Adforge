// Template registry. Templates live as JSON files in /templates (spec §7)
// and carry recommendation metadata (category/aspectRatio/industry/style)
// so the AI can rank them against an angle ("AI suggest, user handpick").

import type { CanvasDef, CreativeState, Layer } from "./types";

import boldHeadlineLeft from "../../../templates/bold-headline-left.json";
import centeredStatement from "../../../templates/centered-statement.json";
import problemSolutionSplit from "../../../templates/problem-solution-split.json";
import testimonialQuote from "../../../templates/testimonial-quote.json";
import featureCallout from "../../../templates/feature-callout.json";
import portraitGradientCta from "../../../templates/portrait-gradient-cta.json";
import linkedinHorizontal from "../../../templates/linkedin-horizontal.json";
import instagramStory from "../../../templates/instagram-story.json";

export interface TemplateMeta {
  key: string;
  name: string;
  category: string;
  aspectRatio: string;
  industry: string;
  style: string;
}

export interface TemplateDef extends TemplateMeta {
  canvas: CanvasDef;
  layers: Layer[];
}

// JSON imports come in as wide literal types; one cast at the boundary.
const raw = [
  boldHeadlineLeft,
  centeredStatement,
  problemSolutionSplit,
  testimonialQuote,
  featureCallout,
  portraitGradientCta,
  linkedinHorizontal,
  instagramStory,
] as unknown as TemplateDef[];

export const templates: TemplateDef[] = raw;

export function getTemplate(key: string): TemplateDef | undefined {
  return templates.find((t) => t.key === key);
}

/** Deep-copied editable state from a template definition. */
export function templateToState(t: TemplateDef): CreativeState {
  return JSON.parse(
    JSON.stringify({ canvas: t.canvas, layers: t.layers }),
  ) as CreativeState;
}

/** Metadata-only view, sent to the AI for template recommendation. */
export function templateMetas(): TemplateMeta[] {
  return templates.map(({ key, name, category, aspectRatio, industry, style }) => ({
    key,
    name,
    category,
    aspectRatio,
    industry,
    style,
  }));
}
