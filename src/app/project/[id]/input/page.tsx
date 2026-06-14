import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { InputScreen } from "@/components/project/InputScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) return <SetupNotice what="Projects" />;
  const { id } = await params;
  return <InputScreen projectId={id} />;
}
