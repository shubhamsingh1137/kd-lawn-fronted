/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gold:  { DEFAULT: "#b8860b", light: "#d4a017", dark: "#8b6508" },
        cream: { DEFAULT: "#fdf6e3", dark: "#f5e6c8" },
      },
      fontFamily: {
        serif:  ["'Playfair Display'", "Georgia", "serif"],
        sans:   ["'Poppins'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
