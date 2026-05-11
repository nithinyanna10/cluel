/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#7C6CFF",
          hover:   "#8B7CFF",
          muted:   "rgba(124,108,255,0.15)",
          glow:    "rgba(124,108,255,0.35)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Inter",
          "sans-serif",
        ],
        mono: ["SF Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "2.5xl": "20px",
        "3xl":   "24px",
      },
      boxShadow: {
        glass:
          "0 20px 60px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.04) inset",
        glow:  "0 0 20px rgba(124,108,255,0.4)",
        card:  "0 2px 8px rgba(0,0,0,0.3)",
      },
      animation: {
        "fade-in":  "fadeIn 0.18s ease-out",
        "slide-up": "slideUp 0.22s ease-out",
        "pulse-dot":"pulseDot 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:   { from: { opacity: "0" },                              to: { opacity: "1" } },
        slideUp:  { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pulseDot: { "0%,100%": { opacity: "1" },                         "50%": { opacity: "0.35" } },
      },
    },
  },
  plugins: [],
};
