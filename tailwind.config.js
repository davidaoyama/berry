/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        atelia: ["Atelia", "system-ui", "sans-serif"],
        marble: ["Marble", "system-ui", "sans-serif"],
      },
      colors: {
        berryPink: "#f77fbe",
        berryTeal: "#52b2bf",
        berryBlue: "#004aad",
        berryGray: "#707070",
      },
    },
  },
  plugins: [],
}
