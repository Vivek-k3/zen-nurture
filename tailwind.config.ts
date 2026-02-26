import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        espresso: "#2D2926",
        oat: "#F5F2EB",
        sage: "#7C9A82",
        "sage-light": "#A8C4AD",
        clay: "#C4A484",
        night: "#1E293B",
        "dusty-blue": "#6B8CAE",
        muted: "#6B6B6B",
        "alert-red": "#E57373",
      },
      fontFamily: {
        serif: ['Georgia', '"Times New Roman"', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
