/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      fontSize: {
        'title-xl': '7.5rem',
        'title-lg': '4rem',
        'title-md': '2.5rem',
        'title-sm': '1.5rem',
      },
      fontWeight: {
        'title-normal': '400',
        'title-bold': '900',
      },
      letterSpacing: {
        'title-xl': '-2.5px',
        'title-lg': '-1.5px',
        'title-md': '-1px',
        'title-sm': '-0.5px',
      },
      margin: {
        'title-top': '8.25rem',
        'title-left': '-3.075rem',
      },
      colors: {
        'title': '#354052',
      },
    },
  },
  plugins: [],
}
