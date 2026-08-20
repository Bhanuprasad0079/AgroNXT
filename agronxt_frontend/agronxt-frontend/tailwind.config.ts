import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface-container": "#f0eded",
        "surface-bright": "#fcf9f8",
        "tertiary-fixed-dim": "#ffb866",
        "on-error-container": "#93000a",
        "surface-container-lowest": "#ffffff",
        "secondary-fixed-dim": "#ebbcac",
        "surface": "#fcf9f8",
        "on-secondary": "#ffffff",
        "on-tertiary-fixed-variant": "#673d00",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-tertiary-container": "#ffb761",
        "on-surface": "#1b1c1c",
        "on-primary-fixed": "#002204",
        "on-primary-container": "#86d881",
        "secondary": "#7a5649",
        "on-primary-fixed-variant": "#005312",
        "inverse-surface": "#303030",
        "surface-container-highest": "#e5e2e1",
        "surface-tint": "#1b6d24",
        "secondary-fixed": "#ffdbcf",
        "primary": "#00450d",
        "on-tertiary-fixed": "#2b1700",
        "background": "#fcf9f8",
        "surface-dim": "#dcd9d9",
        "on-secondary-fixed-variant": "#603f33",
        "outline": "#717a6d",
        "on-surface-variant": "#41493e",
        "primary-container": "#065f18",
        "on-secondary-fixed": "#2e150b",
        "surface-variant": "#e5e2e1",
        "primary-fixed": "#a3f69c",
        "surface-container-low": "#f6f3f2",
        "tertiary-container": "#764700",
        "tertiary-fixed": "#ffddba",
        "on-background": "#1b1c1c",
        "on-tertiary": "#ffffff",
        "on-secondary-container": "#795548",
        "inverse-primary": "#88d982",
        "on-error": "#ffffff",
        "surface-container-high": "#eae7e7",
        "on-primary": "#ffffff",
        "inverse-on-surface": "#f3f0ef",
        "tertiary": "#563300",
        "primary-fixed-dim": "#88d982",
        "outline-variant": "#c0c9bb",
        "secondary-container": "#fdcdbc"
      },
      fontFamily: {
        "headline": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Manrope", "sans-serif"],
        "label": ["Manrope", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "2xl": "2rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
};
export default config;