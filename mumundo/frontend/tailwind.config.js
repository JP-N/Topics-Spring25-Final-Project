/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index_old.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        // Mumundo Colors that are used tailwind-wide, feel free to change
        mumundoBlack : '#010400',
        mumundoBlackOlive : '#30332E',
        mumundoTimberwolf : '#EADEDA',
        mumundoSnow : '#FFFBFC',
        mumundoRed : '#D66B70',
        mumundoRedLight : '#F1C6C9',

      },
      fontFamily: {
        sans: ['Titillium Web', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

