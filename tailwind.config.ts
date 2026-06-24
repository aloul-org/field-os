import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Semantic status tokens used across leads, jobs, invoices, win-probability.
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pill: "999px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-rise": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // The page-enter motion — content rises along the "route line".
        "slide-up-fade": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        // Command palette entrance.
        "overlay-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "command-in": {
          from: { opacity: "0", transform: "translate(-50%, -8px) scale(0.98)" },
          to: { opacity: "1", transform: "translate(-50%, 0) scale(1)" },
        },
        // The signature Route Line draws itself in (uses pathLength=1).
        "draw-line": {
          from: { strokeDashoffset: "1" },
          to: { strokeDashoffset: "0" },
        },
        // The "you are here" stop marker on the nav route line.
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.5" },
          "70%, 100%": { transform: "scale(2.4)", opacity: "0" },
        },
        // A travelling pulse along the dashboard route line.
        "route-travel": {
          "0%": { offsetDistance: "0%", opacity: "0" },
          "10%, 90%": { opacity: "1" },
          "100%": { offsetDistance: "100%", opacity: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        // The modern top loader shown during route transitions.
        "progress-indeterminate": {
          "0%": { transform: "translateX(-100%) scaleX(0.35)" },
          "50%": { transform: "translateX(0%) scaleX(0.6)" },
          "100%": { transform: "translateX(100%) scaleX(0.35)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-rise": "fade-rise 0.4s ease-out both",
        "slide-up-fade": "slide-up-fade 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scale-in 0.25s cubic-bezier(0.16,1,0.3,1) both",
        "overlay-in": "overlay-in 0.2s ease-out both",
        "command-in": "command-in 0.22s cubic-bezier(0.16,1,0.3,1) both",
        "draw-line": "draw-line 1.1s cubic-bezier(0.16,1,0.3,1) forwards",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.16,1,0.3,1) infinite",
        shimmer: "shimmer 2s infinite",
        "progress-indeterminate": "progress-indeterminate 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
