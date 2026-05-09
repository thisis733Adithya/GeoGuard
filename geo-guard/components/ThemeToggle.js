"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "dark");
    
    // Setup observer to watch for theme changes from other tabs or scripts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          setTheme(document.documentElement.dataset.theme);
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("geoGuardTheme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--surface-strong)] hover:text-[var(--heading)] cursor-pointer outline-none focus-visible:shadow-[var(--ring)]"
      aria-label="Toggle light and dark theme"
      title="Toggle theme"
    >
      <span className="relative inline-flex h-5 w-9 items-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] p-0.5 transition-colors" aria-hidden="true">
        <span 
          className={`block h-4 w-4 rounded-full bg-[var(--brand)] transition-transform duration-200 ${
            theme === 'light' ? 'translate-x-0' : 'translate-x-4'
          }`} 
        />
      </span>
      <span>Theme</span>
    </button>
  );
}
