/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Erlaubt uns, Klassen wie `font-aboro` zu verwenden
        aboro: ["Aboro", "cursive"],
        abind: ["Abind", "serif"],
        abang: ["Abang", "sans-serif"],
      },
    },
  },
  plugins: [],
};
