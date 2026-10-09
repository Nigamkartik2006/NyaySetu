/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          bg: '#FBF7F7',
          card: '#FFFFFF',
          cardAlt: '#F1E9E3',
          primary: '#EE712B',
          primaryDark: '#DC4712',
          text: '#0f172a',
          textMuted: '#475569',
          border: '#e2e8f0',
          borderAlt: '#e2d7cd',
        }
      }
    },
  },
  plugins: [],
}
