import type { Config } from "tailwindcss";
import daisyui from "daisyui"

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'primary': '#8A2BE2', // A vibrant purple
        'background-start': '#1A1A2E',
        'background-end': '#16213E',
      },
      animation: {
        'gradient-bg': 'gradient-bg 15s ease infinite',
        'glow-green': 'glow-green 2s ease-in-out infinite',
        'glow-red': 'glow-red 2s ease-in-out infinite',
      },
      keyframes: {
        'gradient-bg': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'glow-green': {
          '0%, 100%': { 'box-shadow': '0 0 5px 0px rgba(74, 222, 128, 0.7)' },
          '50%': { 'box-shadow': '0 0 10px 2px rgba(74, 222, 128, 0.3)' },
        },
        'glow-red': {
            '0%, 100%': { 'box-shadow': '0 0 5px 0px rgba(239, 68, 68, 0.7)' },
            '50%': { 'box-shadow': '0 0 10px 2px rgba(239, 68, 68, 0.3)' },
        }
      },
    },
  },
  plugins: [daisyui],
} satisfies Config;
