// Dashboard (spec §9.2). The proxy redirects logged-out users to /login, so when
// Supabase is configured we can render the project list directly. Without a
// backend, fall back to the setup notice + editor demo entry point.

import { Dashboard } from "@/components/dashboard/Dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import Link from "next/link";

export default function Home() {
  if (isSupabaseConfigured) return <Dashboard />;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">AdForge</h1>
        <p className="mt-2 text-slate-500">
          AI-written copy poured into fully editable ad templates. No raw image
          generation — every pixel stays yours.
        </p>
      </div>
      <p className="text-sm text-slate-500">
        Add your Supabase keys to <code>.env.local</code> (see the README) to sign
        up and create projects. Until then, the editor core works standalone:
      </p>
      <div>
        <Link
          href="/editor-demo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Open editor demo →
        </Link>
      </div>
    </main>
  );
}
