"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTheme } from "@/app/actions/theme";

export function useThemeToggle() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.classList.contains("dark") ? "light" : "dark";
    root.classList.toggle("dark", next === "dark");
    startTransition(async () => {
      await setTheme(next);
      router.refresh();
    });
  }

  return { toggleTheme, isPending };
}
