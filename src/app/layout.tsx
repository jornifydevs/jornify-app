import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type React from "react";
import { cn } from "@/lib/utils";
import { InactivityGuard } from "@/components/InactivityGuard";
import { AppFooter } from "@/components/AppFooter";
import { PreviewBanner } from "@/components/PreviewBanner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { cookies } from "next/headers";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
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
    <html
      lang={locale}
      className={cn(
        geistSans.variable,
        geistMono.variable,
        theme === "dark" && "dark"
      )}
    >
      <body className="font-sans antialiased flex min-h-screen flex-col">
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
