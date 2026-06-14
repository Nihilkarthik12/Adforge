import { SetupNotice } from "@/components/SetupNotice";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { EditorLoader } from "@/components/project/EditorLoader";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; creativeId: string }>;
}) {
  if (!isSupabaseConfigured) return <SetupNotice what="The editor" />;
  const { id, creativeId } = await params;
  return (
    <ErrorBoundary>
      <EditorLoader projectId={id} creativeId={creativeId} />
    </ErrorBoundary>
  );
}
