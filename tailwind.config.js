/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}', '!./node_modules'],
  theme: {
    extend: {
      colors: ({ colors }) => {
        return {
          accent: colors.emerald,
          focused: colors.pink[500],
          page: '#262626',
          content: '#f8fafb',
          panel: colors.zinc[900],
        };
      },
      borderRadius: {
        panel: '12px',
      },
    },
  },
  // CAREFUL! Be specific with regexes!
  // https://github.com/tailwindlabs/tailwindcss/issues/8845#issuecomment-1184569469
  safelist: [
    {
      pattern: /(^text|outline|bg|border|shadow)-[a-z]+-\d+$/,
      variants: ['hover', 'focus', 'active', 'group-hover', 'before'],
    },
  ],
  plugins: [],
};
