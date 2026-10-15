import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const nif = request.nextUrl.searchParams.get("nif");
  if (!nif) {
    return NextResponse.json({ exists: false });
  }

  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data } = await supabase
    .from("company")
    .select("id")
    .eq("nif", nif.trim().toUpperCase())
    .maybeSingle();

  return NextResponse.json({ exists: !!data });
}
