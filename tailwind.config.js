/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'plum': '#371931',
        'milk': '#FFF3E5',
        
        // Map standard aliases for automated compliance
        'background': '#FFF3E5',
        'on-background': '#371931',
        'surface': '#FFF3E5',
        'on-surface': '#371931',
        'primary': '#371931',
        'on-primary': '#FFF3E5',
        'secondary': '#FFF3E5',
        'on-secondary': '#371931',
        'outline': '#371931',
        'outline-variant': '#371931',
        'border': '#371931',
        
        // Map other semantic items to prevent breaking existing classes
        'error': '#371931',
        'on-error': '#FFF3E5',
        'error-container': '#FFF3E5',
        'on-error-container': '#371931',
        'destructive': '#371931',
        'destructive-foreground': '#FFF3E5',
        'accent': '#371931',
        'accent-foreground': '#FFF3E5',
        'muted': '#FFF3E5',
        'muted-foreground': '#371931',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Outfit', 'sans-serif'],
        geist: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'data-mono': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      borderRadius: {
        // Strictly override all tokens to 8px (0.5rem)
        'sm': '0.5rem',
        DEFAULT: '0.5rem',
        'md': '0.5rem',
        'lg': '0.5rem',
        'xl': '0.5rem',
        '2xl': '0.5rem',
        'full': '0.5rem',
      },
      boxShadow: {
        'plum-sm': '0 1px 2px rgba(55, 25, 49, 0.05)',
        'plum-md': '0 4px 6px -1px rgba(55, 25, 49, 0.08), 0 2px 4px -1px rgba(55, 25, 49, 0.06)',
        'plum-lg': '0 10px 15px -3px rgba(55, 25, 49, 0.1), 0 4px 6px -2px rgba(55, 25, 49, 0.05)',
        'milk-sm': '0 1px 2px rgba(255, 243, 229, 0.05)',
        'milk-md': '0 4px 6px -1px rgba(255, 243, 229, 0.08), 0 2px 4px -1px rgba(255, 243, 229, 0.06)',
        'milk-lg': '0 10px 15px -3px rgba(255, 243, 229, 0.1), 0 4px 6px -2px rgba(255, 243, 229, 0.05)',
      },
      spacing: {
        'base': '8px',
        'container-max': '1440px',
        'gutter': '24px',
        'margin-desktop': '40px',
        'margin-mobile': '16px',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
