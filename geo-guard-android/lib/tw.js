import { create } from 'twrnc';

const tw = create({
  theme: {
    extend: {
      colors: {
        accent: '#10b981',
        warning: '#f5a524',
        danger: '#f31260',
        surface: '#ffffff',
        'surface-dark': '#111111',
        'surface-strong': '#fafafa',
        'surface-strong-dark': '#1a1a1a',
        'bg-soft': '#f4f4f5',
        'bg-soft-dark': '#0a0a0a',
        heading: '#000000',
        'heading-dark': '#ffffff',
        'text-main': '#18181b',
        'text-main-dark': '#ededed',
        'text-muted': '#52525b',
        'text-muted-dark': '#a1a1aa',
        'text-soft': '#a1a1aa',
        'text-soft-dark': '#71717a',
        'border-c': 'rgba(0,0,0,0.1)',
        'border-c-dark': 'rgba(255,255,255,0.1)',
        brand: '#000000',
        'brand-dark': '#ffffff',
      },
    },
  },
});

export default tw;
