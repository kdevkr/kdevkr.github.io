// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./.vitepress/**/*.{js,ts,vue,html}", // Include VitePress config and theme files
    "./**/*.md", // Include all Markdown files
    "./**/*.vue", // Include any Vue components you might use
  ],
  theme: {
    extend: {},
  },
  plugins: ['@tailwindcss/postcss'],
}