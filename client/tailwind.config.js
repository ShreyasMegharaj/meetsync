/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: "rgba(var(--theme-white), <alpha-value>)",
        black: "rgba(var(--theme-black), <alpha-value>)",
      }
    },
  },
  plugins: [],
}

