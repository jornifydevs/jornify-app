import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    // Probar conexión consultando la tabla center
    const { error, count } = await supabase
      .from("center")
      .select("*", { count: "exact", head: true })
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          connection: false,
          error: error.message,
          code: error.code,
          timestamp,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      connection: true,
      database: {
        accessible: true,
        table_tested: "center",
        row_count: count ?? 0,
      },
      timestamp,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        status: "error",
        connection: false,
        error: errorMessage,
        timestamp,
      },
      { status: 500 }
    );
  }
}
