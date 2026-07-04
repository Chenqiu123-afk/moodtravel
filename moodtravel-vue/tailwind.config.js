/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      /* ================================================================
         Color System — Morandi 低饱和自然色系
         Primary: Sage Green (鼠尾草绿) — 年轻、高级、性冷淡风
         Accent:  Dusty Blue (雾霾蓝) — 柔和、不伤眼、适配老人
         ================================================================ */
      colors: {
        sage: {
          50:  '#F4F7F3',
          100: '#E6EFE5',
          200: '#CDDFCA',
          300: '#AFC9AC',
          400: '#8FB18B',
          500: '#7A9E76',
          600: '#648262',
          700: '#526A50',
          800: '#455644',
          900: '#3A483A',
          950: '#1E261E',
        },
        dust: {
          50:  '#F3F6F8',
          100: '#E4EBF0',
          200: '#CBD7E1',
          300: '#A7BBCB',
          400: '#7C99B1',
          500: '#5C7E9A',
          600: '#4B6880',
          700: '#405568',
          800: '#384858',
          900: '#313E4B',
          950: '#1F2730',
        },
        warm: {
          50:  '#FDFCF9',
          100: '#FAF7F2',
          200: '#F5F2ED',
          300: '#EDE8E0',
          400: '#DDD6CB',
          500: '#CCC4B6',
          600: '#A8A094',
          700: '#8B8478',
          800: '#726C63',
          900: '#5F5A52',
          950: '#36332F',
        },
        morandi: {
          sage:  '#B5C4B1',
          rose:  '#C9B8B8',
          warm:  '#D4C9B8',
          mist:  '#C8D0C8',
          dusk:  '#B8B8C9',
          sand:  '#DDD0C0',
          clay:  '#C4A8A0',
          olive: '#B8BFA4',
          mauve: '#C4B8C4',
        },
      },

      /* ================================================================
         Typography
         ================================================================ */
      fontSize: {
        'xs':    ['11px', { lineHeight: '1.5',  letterSpacing: '0.3px' }],
        'sm':    ['12px', { lineHeight: '1.55', letterSpacing: '0.4px' }],
        'base':  ['14px', { lineHeight: '1.6',  letterSpacing: '0.5px' }],
        'md':    ['15px', { lineHeight: '1.6',  letterSpacing: '0.5px' }],
        'lg':    ['16px', { lineHeight: '1.65', letterSpacing: '0.4px' }],
        'xl':    ['18px', { lineHeight: '1.6',  letterSpacing: '0.3px' }],
        '2xl':   ['20px', { lineHeight: '1.55', letterSpacing: '0.2px' }],
        '3xl':   ['24px', { lineHeight: '1.5',  letterSpacing: '0.1px' }],
        '4xl':   ['28px', { lineHeight: '1.45', letterSpacing: '0' }],
        '5xl':   ['34px', { lineHeight: '1.4',  letterSpacing: '-0.5px' }],

        'xs-xl':  ['13px', { lineHeight: '1.7',  letterSpacing: '0.5px' }],
        'sm-xl':  ['14px', { lineHeight: '1.7',  letterSpacing: '0.5px' }],
        'base-xl':['16px', { lineHeight: '1.75', letterSpacing: '0.6px' }],
        'md-xl':  ['18px', { lineHeight: '1.75', letterSpacing: '0.5px' }],
        'lg-xl':  ['20px', { lineHeight: '1.7',  letterSpacing: '0.4px' }],
        'xl-xl':  ['22px', { lineHeight: '1.65', letterSpacing: '0.3px' }],
        '2xl-xl': ['26px', { lineHeight: '1.6',  letterSpacing: '0.2px' }],
        '3xl-xl': ['30px', { lineHeight: '1.55', letterSpacing: '0.1px' }],
        '4xl-xl': ['36px', { lineHeight: '1.5',  letterSpacing: '0' }],
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },

      borderRadius: {
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
        'full': '9999px',
      },

      boxShadow: {
        'soft':    '0 2px 12px rgba(0,0,0,0.04)',
        'soft-md': '0 4px 16px rgba(0,0,0,0.06)',
        'soft-lg': '0 6px 24px rgba(0,0,0,0.08)',
        'float':   '0 4px 20px rgba(0,0,0,0.05)',
        'elevate': '0 8px 32px rgba(0,0,0,0.08)',
        'glow-sm': '0 0 0 3px rgba(122, 158, 118, 0.1)',
        'glow':    '0 0 0 4px rgba(122, 158, 118, 0.15)',
        'glow-dust': '0 0 0 4px rgba(92, 126, 154, 0.12)',
      },

      /* ================================================================
         Transition Timing — 弹簧曲线引擎
         ================================================================ */
      transitionTimingFunction: {
        'spring':  'cubic-bezier(0.32, 0.72, 0, 1)',      /* iOS 弹簧 */
        'spring-out': 'cubic-bezier(0.16, 1, 0.3, 1)',      /* 弹性出场 */
        'spring-in': 'cubic-bezier(0.55, 0, 1, 0.45)',       /* 弹性入场 */
        'smooth':  'cubic-bezier(0.25, 0.46, 0.45, 0.94)',  /* 平滑 */
        'bounce':  'cubic-bezier(0.34, 1.56, 0.64, 1)',     /* 回弹 */
        'expo':    'cubic-bezier(0.19, 1, 0.22, 1)',        /* 指数衰减 */
      },

      transitionDuration: {
        'instant': '120ms',
        'fast':    '180ms',
        'normal':  '280ms',
        'slow':    '400ms',
        'spring':  '550ms',
      },

      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'PingFang SC', 'serif'],
        body:    ['Inter', 'PingFang SC', 'Hiragino Sans GB', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'PingFang SC', 'Hiragino Sans GB', 'system-ui', 'sans-serif'],
      },

      fontWeight: {
        thin:  '200',
        light: '300',
        normal:'400',
        medium:'500',
        semibold:'600',
        bold:  '700',
        extrabold:'800',
      },
    },
  },
  plugins: [],
}