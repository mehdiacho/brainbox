/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Escaped glob pattern to prevent build errors
  ],
  theme: {
    extend: {
        animation: {
            'progress-bar': 'progress-bar 2s linear infinite',
        },
        keyframes: {
            'progress-bar': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(300%)' },
            }
        }
    },
  },
  plugins: [
    // In a real file, you would use require('@tailwindcss/typography')
    // Using a string here to prevent build environment errors.
    require('@tailwindcss/typography'),
  ],
}

