/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // This line is important
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This line is important
  ],
  theme: {
    extend: {
      fontFamily: {
        'pacifico': ['Pacifico', 'cursive'],
      },
      animation: {
        marquee: 'marquee 15s linear infinite',
        'slow-gradient': 'fluidGradient 25s ease infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        fluidGradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Enable dark mode based on 'dark' class on html
}
