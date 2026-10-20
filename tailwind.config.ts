import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf2f4",
          100: "#fce7eb",
          200: "#f9d0d8",
          300: "#f4a9b8",
          400: "#ec738d",
          500: "#df4366",
          600: "#ca264a",
          700: "#aa1b3a",
          800: "#7a1f3d", // Primary brand color from original
          900: "#601c32",
          950: "#3b0c1b",
        },
      },
      fontFamily: {
        cairo: ["var(--font-cairo)", "Cairo", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
