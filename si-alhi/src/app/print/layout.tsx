"use client";

import { useEffect } from "react";

// Les pages d'impression (emploi du temps, bulletins, recus, PV) doivent
// toujours s'afficher et s'imprimer en clair, quel que soit le mode (clair
// ou sombre) de l'application. On force donc le theme clair sur ces routes.
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    document.body.style.background = "#e0e0e0";
    document.body.style.color = "#1A1A1A";
    return () => {
      // Restaurer le theme initial en quittant la page d'impression
      if (wasDark) root.classList.add("dark");
      root.style.colorScheme = "";
      document.body.style.background = "";
      document.body.style.color = "";
    };
  }, []);

  return <>{children}</>;
}
