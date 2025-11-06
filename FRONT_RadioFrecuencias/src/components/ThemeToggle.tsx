"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;

    // Apply the theme
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    setDark(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);

    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("theme", next ? "dark" : "light");
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button className="btn btn-outline" title="Cambiar tema" disabled>
        ☀︎
      </button>
    );
  }

  return (
    <button onClick={toggle} className="btn btn-outline" title="Cambiar tema">
      {dark ? "☾" : "☀︎"}
    </button>
  );
}
