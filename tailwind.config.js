/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        farzin: {
          bg: '#161512',       // خاکستری زغالی مات (پس‌زمینه اصلی)
          panel: '#262421',    // رنگ پنل‌ها (لیچس استایل)
          border: '#35332e',   // بردرهای پنل‌ها
          accent: '#779556',   // سبز شطرنجی اصیل
          glow: '#95b969',     // درخشش سبز روشن‌تر
        }
      },
      animation: {
        'typing': 'typing 1.4s infinite ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        typing: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.3' },
          '50%': { transform: 'translateY(-3px)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1, filter: 'drop-shadow(0 0 8px rgba(119,149,86,0.5))' },
          '50%': { opacity: .7, filter: 'drop-shadow(0 0 2px rgba(119,149,86,0.2))' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}