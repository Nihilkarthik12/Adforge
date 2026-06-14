// Shown on backend-dependent screens when Supabase env vars are absent, so the
// app gives a clear setup path instead of crashing (the Phase 1 editor demo and
// these notices stay reachable with no backend — see lib/supabase/env.ts).

import Link from "next/link";

export function SetupNotice({ what = "This screen" }: { what?: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold text-slate-900">Backend not configured</h1>
      <p className="text-slate-600">
        {what} needs Supabase. Add{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        to <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">.env.local</code>,
        run the SQL schema, then restart the dev server. See the README for the
        full setup.
      </p>
      <Link
        href="/editor-demo"
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        Try the editor demo (no backend needed) →
      </Link>
    </main>
  );
}
