import { AuthForm } from "@/components/auth/AuthForm";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function SignupPage() {
  if (!isSupabaseConfigured) return <SetupNotice what="Signing up" />;
  return <AuthForm mode="signup" />;
}
