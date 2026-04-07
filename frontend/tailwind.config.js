/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        campus: {
          50: "#eefdf6",
          100: "#d7fae8",
          200: "#b3f4d3",
          300: "#7de9b8",
          400: "#34d399",
          500: "#0f9d58",
          600: "#0d824a",
          700: "#0c693d",
          800: "#0a4f2f",
          900: "#083724"
        }
      },
      fontFamily: {
        sans: ["Poppins", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 40px rgba(8, 55, 36, 0.12)"
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        floatIn: "floatIn 0.45s ease-out both"
      }
    }
  },
  plugins: []
};
