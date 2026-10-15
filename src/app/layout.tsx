import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import type React from "react";
import { cn } from "@/lib/utils";
import { InactivityGuard } from "@/components/InactivityGuard";
import { AppFooter } from "@/components/AppFooter";
import { PreviewBanner } from "@/components/PreviewBanner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { cookies } from "next/headers";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jornify - Gestión de Horarios",
  description: "Sistema de gestión y control de horarios laborales",
  keywords: [
    "gestión de horarios",
    "control laboral",
    "registro de horas",
    "jornify",
    "time tracking",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const cookieStore = await cookies();
  const theme = (cookieStore.get("JORNIFY_THEME")?.value ?? "dark") as
    | "dark"
    | "light";

  return (
    <html lang={locale} className={theme === "dark" ? "dark" : ""}>
      <body
        className={cn(
          bricolageGrotesque.className,
          "antialiased flex min-h-screen flex-col"
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PreviewBanner />
          <InactivityGuard>
            <main className="flex-1 flex flex-col">{children}</main>
          </InactivityGuard>
          <AppFooter theme={theme} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
