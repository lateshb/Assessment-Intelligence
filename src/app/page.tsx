import { createClient } from "@/lib/supabase/server";
import AppFlow from "@/components/AppFlow";
import PublicLandingPage from "@/components/PublicLandingPage";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <PublicLandingPage />;
  }

  return <AppFlow />;
}

