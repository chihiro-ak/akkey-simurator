import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f7f8fb",
        ink: "#18212f",
        mist: "#eef2f8",
        line: "#dde3ee",
        accent: "#2563eb",
        accentSoft: "#e8f0ff"
      },
      fontFamily: {
        sans: ["\"Hiragino Sans\"", "\"Yu Gothic\"", "sans-serif"]
      },
      boxShadow: {
        panel: "0 24px 60px rgba(24, 33, 47, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
