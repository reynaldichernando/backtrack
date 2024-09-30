import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'rgb(var(--background))',
  			foreground: 'rgb(var(--foreground))',
        secondary: 'rgb(var(--secondary))',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate"), require("tailwindcss-safe-area")],
};
export default config;
