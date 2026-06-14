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
  "from-blue-400 to-blue-600",
  "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600",
  "from-orange-400 to-orange-600",
  "from-pink-400 to-pink-600",
  "from-cyan-400 to-cyan-600",
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
        (ps) =>
          ps?.map((p) => (p.id === renamingId ? { ...p, name: trimmed } : p)) ??
          null,
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
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-black text-white">A</span>
            </div>
            <span className="text-lg font-bold text-slate-900">AdForge</span>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your projects</h1>
            <p className="mt-1 text-sm text-slate-500">
              {projects === null
                ? "Loading…"
                : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => setShowNew((v) => !v)}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + New project
          </button>
        </div>

        {/* New project form */}
        {showNew && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                ref={newInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name…"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        {/* Project grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((p, i) => (
            <div
              key={p.id}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Color band */}
              <div
                className={`h-28 bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]}`}
              />

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
                    className="w-full rounded border border-blue-400 px-2 py-0.5 text-sm font-semibold text-slate-900 outline-none"
                  />
                ) : (
                  <Link
                    href={`/project/${p.id}/input`}
                    className="block text-sm font-semibold text-slate-900 hover:text-blue-600"
                  >
                    {p.name}
                  </Link>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(p.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/project/${p.id}/input`}
                    className="flex-1 rounded-lg bg-blue-50 py-1.5 text-center text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => startRename(p)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {projects?.length === 0 && (
            <button
              onClick={() => setShowNew(true)}
              className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-400 transition hover:border-blue-400 hover:text-blue-500"
            >
              <span className="text-3xl font-light">+</span>
              <span className="text-sm font-medium">Create your first project</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
