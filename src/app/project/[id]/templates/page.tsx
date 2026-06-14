import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { TemplatesScreen } from "@/components/project/TemplatesScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) return <SetupNotice what="Projects" />;
  const { id } = await params;
  return <TemplatesScreen projectId={id} />;
}
