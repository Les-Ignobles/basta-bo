import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'martian': ['Martian Grotesk', 'sans-serif'],
        'christmas': ['Christmas Rainbow', 'cursive'],
        'sans': ['Martian Grotesk', 'sans-serif'], // Remplace la police par défaut
      },
      colors: {
        'basta-blue': '#3A14E2',
        'basta-blue-light': '#4A24F2',
        'basta-blue-dark': '#2A04D2',
      },
    },
  },
  plugins: [],
};

export default config;
