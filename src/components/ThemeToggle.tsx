"use client";

import { useTheme } from "@/components/ThemeContext";

export default function ThemeToggle() {
  const { resolved, setTheme, theme } = useTheme();

  const handleClick = () => {
    if (theme === "system") {
      setTheme(resolved === "light" ? "dark" : "light");
    } else if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Theme: ${theme} (${resolved})`}
      className="h-10 w-10 rounded-full flex items-center justify-center border border-muted/10 bg-white hover:border-sage/30 transition-all text-muted hover:text-espresso"
    >
      <span className="material-symbols-outlined text-[20px]">
        {resolved === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
