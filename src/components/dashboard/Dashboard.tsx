"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
  createProject,
  deleteProject,
  listCreatives,
  listProjects,
  renameProject,
  type Creative,
  type Project,
} from "@/lib/db";

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)",
  "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
  "linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)",
  "linear-gradient(135deg, #f97316 0%, #f59e0b 100%)",
];

export function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [creativesByProject, setCreativesByProject] = useState<Record<string, Creative[]>>({});
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listProjects()
      .then(async (ps) => {
        setProjects(ps);
        const entries = await Promise.all(
          ps.map(async (p) => {
            const creatives = await listCreatives(p.id).catch(() => []);
            return [p.id, creatives] as [string, Creative[]];
          })
        );
        setCreativesByProject(Object.fromEntries(entries));
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => { if (showNew) newInputRef.current?.focus(); }, [showNew]);
  useEffect(() => { if (renamingId) renameInputRef.current?.focus(); }, [renamingId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const project = await createProject(name || "Untitled project");
      router.push(`/project/${project.id}/input`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project and all its creatives?")) return;
    const prev = projects;
    setProjects((p) => p?.filter((x) => x.id !== id) ?? null);
    setCreativesByProject((prev) => { const next = { ...prev }; delete next[id]; return next; });
    try {
      await deleteProject(id);
    } catch (e) {
      setProjects(prev ?? null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function startRename(p: Project) {
    setRenamingId(p.id);
    setRenameValue(p.name);
  }

  async function commitRename() {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      setProjects((ps) => ps?.map((p) => (p.id === renamingId ? { ...p, name: trimmed } : p)) ?? null);
      try {
        await renameProject(renamingId, trimmed);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        listProjects().then(setProjects).catch(() => {});
      }
    }
    setRenamingId(null);
  }

  async function handleSignOut() {
    await getSupabaseBrowser().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  // All saved creatives across all projects (most recent first)
  const allCreatives = Object.entries(creativesByProject)
    .flatMap(([projectId, creatives]) =>
      creatives.map((c) => ({ ...c, projectId }))
    )
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const totalCreatives = allCreatives.length;

  return (
    <div className="min-h-screen" style={{ background: "#f4f4f8" }}>

      {/* ── Top nav ── */}
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm shadow-indigo-500/30">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-zinc-900 tracking-tight">AdForge</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white transition"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="5" y1="1" x2="5" y2="9" /><line x1="1" y1="5" x2="9" y2="5" />
              </svg>
              New project
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* ── Hero banner ── */}
        <div
          className="relative mb-8 overflow-hidden rounded-2xl"
          style={{ animation: "fadeInUp 0.5s ease-out" }}
        >
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }} />
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "radial-gradient(circle, #ffffff08 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
          {/* Glow blobs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.5) 0%, transparent 70%)", animation: "floatY 8s ease-in-out infinite" }} />
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-48 w-48 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)", animation: "floatY 10s ease-in-out infinite 2s" }} />

          <div className="relative z-10 flex items-center justify-between p-8">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300/80">Workspace</p>
              <h1 className="text-[2rem] font-extrabold leading-tight text-white">Your projects</h1>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2">
                      <path d="M3 7h18M3 12h18M3 17h18"/>
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-indigo-200/70">
                    {projects === null ? "…" : projects.length} project{projects?.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-indigo-200/70">
                    {totalCreatives} creative{totalCreatives !== 1 ? "s" : ""} saved
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action cards */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNew(true)}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-center backdrop-blur-sm transition hover:bg-white/18"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 transition group-hover:bg-indigo-500/50">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white">New project</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── New project form ── */}
        {showNew && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-lg shadow-indigo-100/50"
            style={{ animation: "scaleIn 0.25s ease-out" }}>
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4">
              <p className="text-sm font-semibold text-zinc-800">Name your project</p>
              <p className="mt-0.5 text-xs text-zinc-500">Give it a descriptive name — you can rename it later.</p>
            </div>
            <form onSubmit={handleCreate} className="flex gap-3 p-5">
              <input
                ref={newInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Schedulr Q3 Campaign"
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }}
              >
                {creating && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setShowNew(false); setName(""); }}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-500 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Jump back in (recent creatives) ── */}
        {allCreatives.length > 0 && (
          <div className="mb-8" style={{ animation: "fadeInUp 0.5s ease-out 0.1s backwards" }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Jump back in</p>
              <p className="text-xs text-zinc-400">{allCreatives.length} saved creative{allCreatives.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none" }}>
              {allCreatives.map((c, i) => {
                const project = projects?.find((p) => p.id === c.projectId);
                return (
                  <Link
                    key={c.id}
                    href={`/project/${c.projectId}/editor/${c.id}`}
                    className="group shrink-0 w-48 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/60"
                    style={{
                      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                      animation: `fadeInUp 0.4s ease-out ${i * 0.05}s backwards`,
                    }}
                  >
                    <div className="relative h-28 overflow-hidden bg-zinc-100">
                      {c.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.thumbnail_url}
                          alt={c.template_key}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-xs text-zinc-400">
                          {c.template_key}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-[11px] font-semibold text-zinc-800 truncate">{project?.name ?? "Project"}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-400 truncate">{c.template_key}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Section header ── */}
        {projects !== null && projects.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* ── Project grid ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((p, i) => {
            const creatives = creativesByProject[p.id] ?? [];
            const latestCreative = creatives[0] ?? null;
            const hasThumbnail = Boolean(latestCreative?.thumbnail_url);

            return (
              <div
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-zinc-200/80 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/80"
                style={{
                  boxShadow: "0 2px 14px rgba(0,0,0,0.06)",
                  animation: `fadeInUp 0.45s ease-out ${0.15 + i * 0.07}s backwards`,
                }}
              >
                {/* Card visual — thumbnail or gradient */}
                {hasThumbnail ? (
                  <Link
                    href={`/project/${p.id}/editor/${latestCreative!.id}`}
                    className="relative block h-44 overflow-hidden bg-zinc-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={latestCreative!.thumbnail_url!}
                      alt="Creative preview"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Bottom gradient overlay with open-editor CTA */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    <div className="absolute bottom-0 inset-x-0 translate-y-2 p-4 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Open in editor
                      </span>
                    </div>
                    {/* Creative count pill */}
                    {creatives.length > 1 && (
                      <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                        {creatives.length} creatives
                      </span>
                    )}
                    {/* Saved badge */}
                    <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      Saved
                    </span>
                  </Link>
                ) : (
                  <div
                    className="relative h-36 overflow-hidden"
                    style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                  >
                    <div className="absolute inset-0"
                      style={{ backgroundImage: "radial-gradient(circle, #ffffff15 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
                    <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 60%)" }} />
                    {/* Initial letter */}
                    <div className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                      <span className="text-2xl font-black text-white">{p.name.charAt(0).toUpperCase()}</span>
                    </div>
                    {/* No creatives label */}
                    <div className="absolute right-4 top-4 rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                      No creatives yet
                    </div>
                  </div>
                )}

                {/* Card body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {renamingId === p.id ? (
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="w-full rounded-lg border border-indigo-400 px-2 py-1 text-sm font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      ) : (
                        <p className="truncate text-sm font-bold text-zinc-900">{p.name}</p>
                      )}
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        {creatives.length > 0
                          ? `${creatives.length} creative${creatives.length !== 1 ? "s" : ""} · ${new Date(creatives[0].updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                          : `Created ${new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        }
                      </p>
                    </div>

                    {/* Kebab actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startRename(p)}
                        className="rounded-lg border border-zinc-200 p-1.5 text-zinc-400 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700"
                        title="Rename"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="rounded-lg border border-zinc-200 p-1.5 text-zinc-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                        title="Delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 flex items-center gap-2">
                    {latestCreative ? (
                      <Link
                        href={`/project/${p.id}/editor/${latestCreative.id}`}
                        className="group/btn relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl py-2 text-center text-xs font-bold text-white transition-all hover:brightness-110"
                        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 2px 10px rgba(99,102,241,0.30)" }}
                      >
                        <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/10 transition-transform duration-700 group-hover/btn:translate-x-[200%]" />
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Open editor
                      </Link>
                    ) : (
                      <Link
                        href={`/project/${p.id}/input`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2 text-center text-xs font-bold text-white transition hover:bg-zinc-700"
                      >
                        Start building
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>
                    )}
                    <Link
                      href={`/project/${p.id}/input`}
                      className="flex items-center gap-1 rounded-xl border border-zinc-200 px-3 py-2 text-[11px] font-semibold text-zinc-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                      title="New creative"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="5" y1="1" x2="5" y2="9" /><line x1="1" y1="5" x2="9" y2="5" />
                      </svg>
                      New
                    </Link>
                  </div>

                  {/* Multiple creatives thumbnail strip */}
                  {creatives.length > 1 && (
                    <div className="mt-3 border-t border-zinc-100 pt-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">All creatives</p>
                      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                        {creatives.map((c) => (
                          <Link
                            key={c.id}
                            href={`/project/${p.id}/editor/${c.id}`}
                            className="shrink-0"
                            title={c.template_key}
                          >
                            {c.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={c.thumbnail_url}
                                alt={c.template_key}
                                className="h-12 w-12 rounded-lg border border-zinc-200 object-cover shadow-sm transition hover:border-indigo-400 hover:shadow-md hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-[9px] font-medium text-zinc-400">
                                {c.template_key.slice(0, 6)}
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {projects?.length === 0 && (
            <button
              onClick={() => setShowNew(true)}
              className="col-span-full flex h-64 flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-zinc-200 bg-white text-zinc-400 transition hover:border-indigo-400 hover:bg-indigo-50/40 hover:text-indigo-500"
              style={{ animation: "fadeInUp 0.5s ease-out" }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-current">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Create your first project</p>
                <p className="mt-1 text-xs">Paste your business info and let AI do the rest</p>
              </div>
            </button>
          )}

          {/* Loading skeleton */}
          {projects === null && [0, 1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white"
              style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.07}s backwards` }}>
              <div className="h-44 bg-zinc-100" style={{ animation: "shimmerBtn 2s linear infinite" }} />
              <div className="p-4 flex flex-col gap-3">
                <div className="h-4 w-32 rounded-lg bg-zinc-100" />
                <div className="h-3 w-24 rounded-lg bg-zinc-100" />
                <div className="h-8 w-full rounded-xl bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
