"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Synchronise l'etat avec la classe appliquee par le script inline du layout,
    // une fois l'hydratation terminee. Lecture unique d'un etat externe (le DOM).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const html = document.documentElement;
    const nowDark = html.classList.toggle("dark");
    setIsDark(nowDark);
    try { localStorage.setItem("alhi-theme", nowDark ? "dark" : "light"); } catch { /* localStorage indisponible */ }
  }

  return (
    <button
      onClick={toggle}
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "8px",
        border: "1.5px solid var(--border)",
        background: "var(--bg-card)",
        color: "var(--text-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark
        ? <Sun style={{ width: "16px", height: "16px", color: "#d97706" }} />
        : <Moon style={{ width: "16px", height: "16px" }} />
      }
    </button>
  );
}
