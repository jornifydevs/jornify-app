import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  await supabase.auth.signOut();

  redirect("/auth/login");
}
