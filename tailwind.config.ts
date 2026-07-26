import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        // Small-phone breakpoint (iPhone SE is 375px): lets a 2-up grid stay
        // 1-up on the narrowest devices without a media query in every view.
        xs: "400px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
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
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
          2: "hsl(var(--brand-2))",
        },
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
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 10px)",
      },
      boxShadow: {
        // Elevation scale — themed in globals.css so dark mode gets its own
        // (deeper, softer) values rather than a washed-out light-mode shadow.
        xs: "var(--shadow-1)",
        card: "var(--shadow-2)",
        pop: "var(--shadow-3)",
        overlay: "var(--shadow-4)",
        "brand-glow": "0 10px 30px -10px hsl(var(--brand) / 0.45)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, hsl(var(--brand)), hsl(var(--brand-2)))",
      },
      transitionTimingFunction: {
        // Apple-ish decelerate. Entering elements use this; exits use ease-in.
        emphasized: "cubic-bezier(0.22, 1, 0.36, 1)",
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
        "glow-green": {
          "0%, 100%": {
            "box-shadow": "0 0 5px 0px rgba(74, 222, 128, 0.7)",
          },
          "50%": {
            "box-shadow": "0 0 10px 2px rgba(74, 222, 128, 0.3)",
          },
        },
        "glow-red": {
          "0%, 100%": {
            "box-shadow": "0 0 5px 0px rgba(239, 68, 68, 0.7)",
          },
          "50%": {
            "box-shadow": "0 0 10px 2px rgba(239, 68, 68, 0.3)",
          },
        },
        // Expanding ring behind a live status dot — reads as "streaming" in a
        // way a static dot cannot. transform/opacity only, so it stays on the
        // compositor.
        "ping-ring": {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "70%, 100%": { transform: "scale(2.4)", opacity: "0" },
        },
        // Page/section entrance. 8px is enough to read as motion without
        // shifting layout on slow devices.
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow-green": "glow-green 2s ease-in-out infinite",
        "glow-red": "glow-red 2s ease-in-out infinite",
        "ping-ring": "ping-ring 2.2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "fade-up": "fade-up 0.42s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;
