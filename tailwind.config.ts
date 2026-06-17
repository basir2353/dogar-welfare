import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      container: {
        center: true,
        padding: "1rem",
        screens: {
          "2xl": "1280px"
        }
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        muted: "var(--muted)",
        border: "var(--border)",
        "on-primary": "var(--on-primary)",
        "on-secondary": "var(--on-secondary)",
        "on-accent": "var(--on-accent)",
        "on-muted": "var(--on-muted)"
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem"
      },
      boxShadow: {
        soft: "0 4px 20px rgba(31, 41, 51, 0.1)",
        card: "var(--card-shadow)",
        glow: "0 4px 24px color-mix(in srgb, var(--primary) 30%, transparent)",
        "input-focus": "var(--input-shadow-focus)"
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(ellipse 90% 70% at 10% 20%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 50%), radial-gradient(ellipse 70% 50% at 90% 80%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 45%)",
        "brand-cta": "linear-gradient(115deg, var(--primary) 0%, var(--secondary) 100%)",
        "brand-badge": "linear-gradient(100deg, color-mix(in srgb, var(--primary) 12%, var(--background)), color-mix(in srgb, var(--accent) 8%, var(--background)))"
      }
    }
  },
  plugins: []
};

export default config;
