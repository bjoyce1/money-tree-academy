import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // DESIGN.md shape families
        paper: "3px",
        thumb: "6px",
        choice: "12px",
        plate: "14px",
        pill: "999px",
      },
      boxShadow: {
        // The Book Objects Rule: only book objects cast shadows.
        plate: "0 30px 60px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(230,185,85,0.22)",
        paper: "0 2px 3px rgba(5,8,20,0.35), 0 30px 60px -18px rgba(5,8,20,0.75)",
        "paper-thumb": "0 18px 36px -14px rgba(5,8,20,0.8)",
        gold: "0 1px 0 rgba(255,255,255,0.35) inset, 0 10px 24px -8px rgba(230,185,85,0.55)",
        sheet: "0 -20px 60px -10px rgba(5,8,20,0.7)",
      },
      maxWidth: {
        measure: "62ch",
        container: "1200px",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        brand: "var(--brand)",
        brand2: "var(--brand2)",
        // DESIGN.md palette
        night: { DEFAULT: "#0b1224", 2: "#101a36", 3: "#15214a" },
        gold: { DEFAULT: "#e6b955", hover: "#f0c869", ink: "#7f5310" },
        cream: { DEFAULT: "#f6efdf", 2: "rgba(246, 239, 223, 0.78)", 3: "rgba(246, 239, 223, 0.62)" },
        hairline: "rgba(230, 185, 85, 0.18)",
        paper: "#fbf6ea",
        // Reader surfaces follow the chosen reading theme (see index.css)
        reader: {
          bg: "var(--r-bg)",
          surface: "var(--r-surface)",
          ink: "var(--r-ink)",
          soft: "var(--r-ink-soft)",
          quiet: "var(--r-ink-quiet)",
          accent: "var(--r-accent)",
          rule: "var(--r-rule)",
          wash: "var(--r-wash)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        display: ["Cinzel", "Times New Roman", "serif"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.3s ease-in",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
