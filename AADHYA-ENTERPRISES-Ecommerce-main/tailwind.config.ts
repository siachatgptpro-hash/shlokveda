import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: "#0F281E",
          800: "#1B4332",
          700: "#2D6A4F",
          600: "#40916C",
          100: "#E8F5E9",
        },
        gold: {
          600: "#B08968",
          500: "#C5A880",
          100: "#F9F6F0",
        },
        surface: {
          base: "#FAF7F2",
          card: "#FFFFFF",
          subtle: "#F3EFE6",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
