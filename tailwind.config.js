/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Rich Chocolate Brown - Primary brand color
        primary: {
          50: "#faf5f2",
          100: "#f4e8e0",
          200: "#e9cfc0",
          300: "#dbb097",
          400: "#cb8a6a",
          500: "#c06d48",
          600: "#b2593d",
          700: "#944634",
          800: "#783a30",
          900: "#633229",
          950: "#351814",
        },
        // Warm Caramel/Gold - Accent color
        caramel: {
          50: "#fefbea",
          100: "#fcf4c5",
          200: "#faea8b",
          300: "#f7d94f",
          400: "#f3c623",
          500: "#e3ac0c",
          600: "#c48407",
          700: "#9c5f0a",
          800: "#814a10",
          900: "#6e3d13",
          950: "#401f06",
        },
        // Cream/Vanilla - Background tones
        cream: {
          50: "#fefdfb",
          100: "#fdfaf5",
          200: "#faf4ea",
          300: "#f5eadb",
          400: "#edd9c4",
          500: "#e3c6aa",
          600: "#d4a97c",
          700: "#c28d5c",
          800: "#a7734c",
          900: "#8a5f42",
          950: "#4c3121",
        },
        // Deep Berry - For CTAs and highlights
        berry: {
          50: "#fdf2f6",
          100: "#fce7ef",
          200: "#fbd0e1",
          300: "#f8a8c6",
          400: "#f271a0",
          500: "#e84580",
          600: "#d52562",
          700: "#b8184b",
          800: "#98173f",
          900: "#7f1938",
          950: "#4d071b",
        },
        // Soft Sage Green - Fresh accent
        sage: {
          50: "#f4f7f4",
          100: "#e5ebe5",
          200: "#ccd8cc",
          300: "#a7bba7",
          400: "#7d9a7e",
          500: "#5c7c5d",
          600: "#486349",
          700: "#3b503c",
          800: "#324133",
          900: "#2a362b",
          950: "#141d15",
        },
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "-apple-system", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        warm: "0 4px 20px -2px rgba(192, 109, 72, 0.2)",
        "warm-lg": "0 10px 40px -4px rgba(192, 109, 72, 0.25)",
        glow: "0 0 30px rgba(227, 172, 12, 0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern":
          "linear-gradient(135deg, #faf5f2 0%, #fdfaf5 50%, #f4f7f4 100%)",
      },
    },
  },
  plugins: [],
};
