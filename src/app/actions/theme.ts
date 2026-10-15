"use server";

import { cookies } from "next/headers";

export async function setTheme(theme: "dark" | "light") {
  const cookieStore = await cookies();
  cookieStore.set("JORNIFY_THEME", theme, { path: "/", maxAge: 31536000 });
}
