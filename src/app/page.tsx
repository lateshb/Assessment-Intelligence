import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppFlow from "@/components/AppFlow";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AppFlow />;
}
