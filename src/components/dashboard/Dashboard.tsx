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
  ["from-indigo-500 to-violet-600", "indigo"],
  ["from-violet-500 to-purple-600", "violet"],
  ["from-sky-500 to-indigo-600", "sky"],
  ["from-emerald-500 to-teal-600", "emerald"],
  ["from-rose-500 to-pink-600", "rose"],
  ["from-orange-500 to-amber-600", "orange"],
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

  useEffect(() => {
    if (showNew) newInputRef.current?.focus();
  }, [showNew]);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

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
      setProjects(
        (ps) => ps?.map((p) => (p.id === renamingId ? { ...p, name: trimmed } : p)) ?? null,
      );
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
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Top nav */}
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="1" x2="6" y2="11" />
                <line x1="1" y1="6" x2="11" y2="6" />
              </svg>
              New project
            </button>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Page heading */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Projects</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {projects === null
                ? "Loading…"
                : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* New project form */}
        {showNew && (
          <div className="mb-6 rounded-xl border border-indigo-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-zinc-800">New project</p>
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                ref={newInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Schedulr Q3 Campaign"
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setShowNew(false); setName(""); }}
                className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Project grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((p, i) => {
            const [gradient] = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
            return (
              <div
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Gradient header */}
                <div className={`relative h-28 bg-gradient-to-br ${gradient} overflow-hidden`}>
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  />
                  <div className="absolute bottom-4 left-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <span className="text-lg font-bold text-white">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
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
                      className="w-full rounded-md border border-indigo-400 px-2 py-1 text-sm font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  ) : (
                    <p className="text-sm font-semibold leading-snug text-zinc-900">{p.name}</p>
                  )}
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Date(p.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      href={`/project/${p.id}/input`}
                      className="flex-1 rounded-lg bg-zinc-900 py-2 text-center text-xs font-semibold text-white transition hover:bg-zinc-700"
                    >
                      Open →
                    </Link>
                    <button
                      onClick={() => startRename(p)}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700"
                      title="Rename"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              className="col-span-full flex h-56 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-300 bg-white text-zinc-400 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-500"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-current">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Create your first project</p>
                <p className="mt-0.5 text-xs">Paste your business info and let AI do the rest</p>
              </div>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
