"use client";

// Browser-side data access for the project flow (spec §6 data model).
// Every call runs through the cookie-authenticated Supabase client, so Row Level
// Security scopes reads/writes to the signed-in user automatically.

import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Angle, CopyFields, CreativeState } from "@/lib/creative/types";

// ---- Row shapes (mirror the SQL schema) ------------------------------------

export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface InputRow {
  id: string;
  project_id: string;
  competitor_text: string | null;
  business_text: string | null;
  uploaded_files: { name: string; storage_path: string }[] | null;
}

export interface AngleRow extends Angle {
  id: string;
  project_id: string;
}

export interface BrandKitRow {
  id: string;
  project_id: string;
  logo_path: string | null;
  color_primary: string;
  color_secondary: string;
  color_text: string;
  bg_image_path: string | null;
}

export interface Creative {
  id: string;
  project_id: string;
  angle_id: string | null;
  template_key: string;
  state_json: CreativeState;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year

function db() {
  return getSupabaseBrowser();
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
  } = await db().auth.getUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

// ---- Projects --------------------------------------------------------------

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await db()
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await db()
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProject(name: string): Promise<Project> {
  const user_id = await requireUserId();
  const { data, error } = await db()
    .from("projects")
    .insert({ name: name.trim() || "Untitled project", user_id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await db().from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function renameProject(id: string, name: string): Promise<void> {
  const { error } = await db()
    .from("projects")
    .update({ name: name.trim() || "Untitled project" })
    .eq("id", id);
  if (error) throw error;
}

// ---- Inputs ----------------------------------------------------------------

export async function getInput(projectId: string): Promise<InputRow | null> {
  const { data, error } = await db()
    .from("inputs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveInput(
  projectId: string,
  fields: {
    competitor_text: string;
    business_text: string;
    uploaded_files?: { name: string; storage_path: string }[];
  },
): Promise<void> {
  // One inputs row per project: upsert by deleting prior rows then inserting.
  await db().from("inputs").delete().eq("project_id", projectId);
  const { error } = await db().from("inputs").insert({
    project_id: projectId,
    competitor_text: fields.competitor_text || null,
    business_text: fields.business_text || null,
    uploaded_files: fields.uploaded_files ?? [],
  });
  if (error) throw error;
}

// ---- Angles ----------------------------------------------------------------

export async function getAngle(id: string): Promise<AngleRow | null> {
  const { data, error } = await db()
    .from("angles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAngles(projectId: string): Promise<AngleRow[]> {
  const { data, error } = await db()
    .from("angles")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Replace the project's angles with a freshly-generated set. */
export async function replaceAngles(
  projectId: string,
  angles: Angle[],
): Promise<AngleRow[]> {
  await db().from("angles").delete().eq("project_id", projectId);
  const rows = angles.map((a) => ({
    project_id: projectId,
    name: a.name,
    core_message: a.core_message,
    hook: a.hook,
    cta: a.cta,
  }));
  const { data, error } = await db().from("angles").insert(rows).select("*");
  if (error) throw error;
  return data ?? [];
}

// ---- Brand kit -------------------------------------------------------------

export async function getBrandKit(
  projectId: string,
): Promise<BrandKitRow | null> {
  const { data, error } = await db()
    .from("brand_kits")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveBrandKit(
  projectId: string,
  kit: {
    logo_path: string | null;
    color_primary: string;
    color_secondary: string;
    color_text: string;
    bg_image_path: string | null;
  },
): Promise<void> {
  await db().from("brand_kits").delete().eq("project_id", projectId);
  const { error } = await db()
    .from("brand_kits")
    .insert({ project_id: projectId, ...kit });
  if (error) throw error;
}

// ---- Creatives -------------------------------------------------------------

export async function listCreatives(projectId: string): Promise<Creative[]> {
  const { data, error } = await db()
    .from("creatives")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCreative(id: string): Promise<Creative | null> {
  const { data, error } = await db()
    .from("creatives")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createCreative(fields: {
  project_id: string;
  angle_id: string | null;
  template_key: string;
  state_json: CreativeState;
}): Promise<Creative> {
  const { data, error } = await db()
    .from("creatives")
    .insert(fields)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateCreative(
  id: string,
  fields: { state_json?: CreativeState; thumbnail_url?: string | null },
): Promise<void> {
  const { error } = await db()
    .from("creatives")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ---- Storage (assets + exports buckets) ------------------------------------

/** Upload a file to a private bucket and return its storage path. */
export async function uploadToBucket(
  bucket: "assets" | "exports",
  projectId: string,
  file: Blob,
  filename: string,
): Promise<string> {
  const userId = await requireUserId();
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${projectId}/${crypto.randomUUID()}-${safe}`;
  const { error } = await db()
    .storage.from(bucket)
    .upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

/** Mint a fresh signed URL for a private object (URLs expire — re-sign on load). */
export async function signedUrl(
  bucket: "assets" | "exports",
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await db()
    .storage.from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error) return null;
  return data.signedUrl;
}

// ---- Draft copy hand-off (Angles → Brand → Template, spec §9) --------------
// The chosen angle's generated copy must survive the brand/template steps before
// a creative row exists. Keep it in sessionStorage keyed by project.
// SPEC-NOTE: a deliberately lightweight hand-off; the durable copy lives in the
// creative's state_json once the template is filled.

interface Draft {
  angleId: string | null;
  copy: CopyFields;
}

const draftKey = (projectId: string) => `adforge:draft:${projectId}`;

export function saveDraftCopy(projectId: string, draft: Draft): void {
  sessionStorage.setItem(draftKey(projectId), JSON.stringify(draft));
}

export function getDraftCopy(projectId: string): Draft | null {
  const raw = sessionStorage.getItem(draftKey(projectId));
  return raw ? (JSON.parse(raw) as Draft) : null;
}

export function clearDraftCopy(projectId: string): void {
  sessionStorage.removeItem(draftKey(projectId));
}
