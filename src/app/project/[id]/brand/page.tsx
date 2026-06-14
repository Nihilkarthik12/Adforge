import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { BrandScreen } from "@/components/project/BrandScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) return <SetupNotice what="Projects" />;
  const { id } = await params;
  return <BrandScreen projectId={id} />;
}
