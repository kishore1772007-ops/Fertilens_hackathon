/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        brand: {
          blue: '#2563eb',
          darkBlue: '#1e40af',
          ice: '#eff6ff',
          iceBorder: '#bfdbfe',
        },
        clinical: {
          blue: '#2563eb',
          lightBlue: '#eff6ff',
          dark: '#0f172a',
          slate: '#334155',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(37, 99, 235, 0.04), 0 1px 2px 0 rgba(15, 23, 42, 0.03)',
        'card-hover': '0 8px 24px -4px rgba(37, 99, 235, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
        talky: '0 4px 20px -4px rgba(37, 99, 235, 0.08)',
      }
    },
  },
  plugins: [],
}
