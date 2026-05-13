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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
