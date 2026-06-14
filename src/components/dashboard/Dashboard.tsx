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

const CARD_COLORS = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-orange-500",
  "bg-pink-600",
  "bg-cyan-600",
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
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
              <span className="text-sm font-black text-white">A</span>
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">AdForge</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNew(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <span className="text-base leading-none">+</span> New project
            </button>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Page title */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-slate-500">
              {projects === null ? "Loading…" : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="sm:hidden flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + New
          </button>
        </div>

        {/* New project form */}
        {showNew && (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-700">New project</p>
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                ref={newInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Schedulr Q3 Campaign"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {/* Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((p, i) => (
            <div
              key={p.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Color header */}
              <div className={`flex h-24 items-end p-4 ${CARD_COLORS[i % CARD_COLORS.length]}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <span className="text-base font-black text-white">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
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
                    className="w-full rounded-md border border-blue-400 px-2 py-1 text-sm font-semibold text-slate-900 outline-none"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900 leading-snug">{p.name}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Created {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/project/${p.id}/input`}
                    className="flex-1 rounded-lg bg-slate-900 py-2 text-center text-xs font-semibold text-white hover:bg-slate-700 transition"
                  >
                    Open →
                  </Link>
                  <button
                    onClick={() => startRename(p)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {projects?.length === 0 && (
            <button
              onClick={() => setShowNew(true)}
              className="col-span-full flex h-52 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-400 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-current">
                <span className="text-2xl font-light">+</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Create your first project</p>
                <p className="text-xs mt-0.5">Paste your business info and let AI do the rest</p>
              </div>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
