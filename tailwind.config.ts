import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import tailwindAnimate from "tailwindcss-animate";
import tailwindTypography from "@tailwindcss/typography";

const token = (name: string) => `oklch(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        card: {
          DEFAULT: token("card"),
          foreground: token("card-foreground"),
        },
        popover: {
          DEFAULT: token("popover"),
          foreground: token("popover-foreground"),
        },
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          foreground: token("destructive-foreground"),
        },
        border: {
          DEFAULT: token("border"),
          strong: token("border-strong"),
        },
        input: token("input"),
        ring: token("ring"),
        track: token("track"),
        brand: {
          DEFAULT: token("brand"),
          foreground: token("brand-foreground"),
          text: token("brand-text"),
          soft: "var(--brand-soft)",
        },
        live: {
          DEFAULT: token("live"),
          text: token("live-text"),
          soft: "var(--live-soft)",
        },
        pause: {
          DEFAULT: token("pause"),
          text: token("pause-text"),
          soft: "var(--pause-soft)",
        },
        alert: {
          text: token("alert-text"),
          soft: "var(--alert-soft)",
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 6px)",
        "2xl": "calc(var(--radius) + 14px)",
      },
      keyframes: {
        "live-pulse": {
          "0%": { boxShadow: "0 0 0 0 oklch(var(--live) / 0.55)" },
          "70%": { boxShadow: "0 0 0 7px oklch(var(--live) / 0)" },
          "100%": { boxShadow: "0 0 0 0 oklch(var(--live) / 0)" },
        },
      },
      animation: {
        "live-pulse": "live-pulse 2s ease-out infinite",
      },
    },
  },
  plugins: [tailwindAnimate, tailwindTypography],
} satisfies Config;
