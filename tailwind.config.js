/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          50: "#fff0f7",
          100: "#ffd9eb",
          200: "#ffb3d6",
          300: "#ff80b8",
          400: "#ff4d9a",
          500: "#EC1E79",
          600: "#C81C6B",
          700: "#a3175a",
          800: "#7e1247",
          900: "#590d34",
          950: "#330520",
        },
        // Kept `mint` alias pointing at brand palette so any leftover classnames still compile during rebrand
        mint: {
          50: "#fff0f7",
          100: "#ffd9eb",
          200: "#ffb3d6",
          300: "#ff80b8",
          400: "#ff4d9a",
          500: "#EC1E79",
          600: "#C81C6B",
          700: "#a3175a",
          800: "#7e1247",
          900: "#590d34",
          950: "#330520",
        },
        primary: {
          DEFAULT: "#EC1E79",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#000000",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f3f4f6",
          foreground: "#6b7280",
        },
        accent: {
          DEFAULT: "#EC1E79",
          foreground: "#000000",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#000000",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#000000",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        // Magic UI
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "marquee-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-100% - var(--gap)))" },
        },
        "border-beam": {
          "100%": { "offset-distance": "100%" },
        },
        "shimmer-slide": {
          to: { transform: "translate(calc(100cqw - 100%), 0)" },
        },
        "spin-around": {
          "0%": { transform: "translateZ(0) rotate(0)" },
          "15%, 35%": { transform: "translateZ(0) rotate(90deg)" },
          "65%, 85%": { transform: "translateZ(0) rotate(270deg)" },
          "100%": { transform: "translateZ(0) rotate(360deg)" },
        },
        gradient: {
          to: { backgroundPosition: "var(--bg-size) 0" },
        },
        "shiny-text": {
          "0%, 90%, 100%": { "background-position": "calc(-100% - var(--shiny-width)) 0" },
          "30%, 60%": { "background-position": "calc(100% + var(--shiny-width)) 0" },
        },
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: 1 },
          "70%": { opacity: 1 },
          "100%": { transform: "rotate(215deg) translateX(-500px)", opacity: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee var(--duration) linear infinite",
        "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        "shimmer-slide": "shimmer-slide var(--speed) ease-in-out infinite alternate",
        "spin-around": "spin-around calc(var(--speed) * 2) infinite linear",
        gradient: "gradient 8s linear infinite",
        "shiny-text": "shiny-text 8s infinite",
        meteor: "meteor 5s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
