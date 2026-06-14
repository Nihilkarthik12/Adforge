import { AuthForm } from "@/components/auth/AuthForm";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function LoginPage() {
  if (!isSupabaseConfigured) return <SetupNotice what="Logging in" />;
  return <AuthForm mode="login" />;
}
