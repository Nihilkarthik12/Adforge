"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
  createProject,
  deleteProject,
  listProjects,
  renameProject,
  type Project,
} from "@/lib/db";

const CARD_GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-violet-500 to-purple-600",
  "from-sky-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-orange-500 to-amber-600",
];

export function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
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
      .then(setProjects)
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

  return (
    <div className="min-h-screen" style={{ background: "#f4f4f8" }}>

      {/* ── Top nav ── */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm shadow-indigo-500/30">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-zinc-900 tracking-tight">AdForge</span>
          </div>
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
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* ── Hero banner ── */}
        <div className="relative mb-10 overflow-hidden rounded-2xl">
          {/* Background gradient */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 60%, #1e1b4b 100%)" }} />
          {/* Dot grid */}
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "radial-gradient(circle, #ffffff0d 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          {/* Glow accents */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.45) 0%, transparent 70%)" }} />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-40 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)" }} />

          <div className="relative z-10 flex items-center justify-between p-8">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-indigo-300">Workspace</p>
              <h1 className="text-3xl font-bold text-white">Your projects</h1>
              <p className="mt-1.5 text-sm text-indigo-200/60">
                {projects === null
                  ? "Loading…"
                  : `${projects.length} project${projects.length !== 1 ? "s" : ""} · AI-powered ad creatives`}
              </p>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="6.5" y1="1" x2="6.5" y2="12" /><line x1="1" y1="6.5" x2="12" y2="6.5" />
              </svg>
              New project
            </button>
          </div>
        </div>

        {/* ── New project form ── */}
        {showNew && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-md">
            <div className="border-b border-indigo-100 bg-indigo-50/60 px-6 py-4">
              <p className="text-sm font-semibold text-zinc-800">Name your project</p>
              <p className="mt-0.5 text-xs text-zinc-500">Give it a descriptive name — you can always rename it later.</p>
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
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
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
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Section label ── */}
        {projects !== null && projects.length > 0 && (
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* ── Project grid ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((p, i) => {
            const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
            return (
              <div
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-zinc-200/80 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/70"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              >
                {/* Gradient header */}
                <div className={`relative h-32 bg-gradient-to-br ${gradient} overflow-hidden`}>
                  {/* Dot pattern */}
                  <div className="absolute inset-0"
                    style={{ backgroundImage: "radial-gradient(circle, #ffffff18 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
                  {/* Hover sheen */}
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
                  {/* Initials badge */}
                  <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                    <span className="text-xl font-bold text-white">{p.name.charAt(0).toUpperCase()}</span>
                  </div>
                  {/* Top-right sparkle */}
                  <div className="absolute right-4 top-4 opacity-30">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                    </svg>
                  </div>
                </div>

                <div className="p-5">
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
                    <p className="text-sm font-semibold leading-snug text-zinc-900">{p.name}</p>
                  )}
                  <p className="mt-1 text-xs text-zinc-400">
                    Created {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      href={`/project/${p.id}/input`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2 text-center text-xs font-semibold text-white transition hover:bg-zinc-700"
                    >
                      Open
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => startRename(p)}
                      className="rounded-xl border border-zinc-200 p-2 text-zinc-400 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700"
                      title="Rename"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded-xl border border-zinc-200 p-2 text-zinc-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                      title="Delete"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {projects?.length === 0 && (
            <button
              onClick={() => setShowNew(true)}
              className="col-span-full flex h-64 flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-zinc-300 bg-white text-zinc-400 transition hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-500"
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
        </div>
      </main>
    </div>
  );
}
