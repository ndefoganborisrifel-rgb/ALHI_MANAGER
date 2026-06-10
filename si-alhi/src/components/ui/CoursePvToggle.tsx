"use client";
import { useState } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";

interface CoursePvToggleProps {
  courseId: string;
  session: "NORMALE" | "RATTRAPAGE";
  initialPublished: boolean;
}

export function CoursePvToggle({ courseId, session, initialPublished }: CoursePvToggleProps) {
  const [published, setPublished] = useState(initialPublished);
  const [toggling, setToggling] = useState(false);

  const field = session === "NORMALE" ? "pvNormalePublished" : "pvRattrapagePublished";

  async function toggle() {
    setToggling(true);
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !published }),
    });
    if (res.ok) setPublished(!published);
    setToggling(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={toggling}
      title={published ? `PV ${session === "NORMALE" ? "Normale" : "Rattrapage"} visible aux étudiants` : `Publier PV ${session === "NORMALE" ? "Normale" : "Rattrapage"}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        background: published ? (session === "NORMALE" ? "#16a34a" : "#7c3aed") : "transparent",
        color: published ? "white" : "var(--text-muted, #6b7280)",
        border: `1px solid ${published ? (session === "NORMALE" ? "#16a34a" : "#7c3aed") : "#d1d5db"}`,
        borderRadius: "5px",
        fontSize: "10px",
        fontWeight: "600",
        cursor: toggling ? "not-allowed" : "pointer",
        opacity: toggling ? 0.7 : 1,
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {published
        ? <><ToggleRight style={{ width: "11px", height: "11px" }} />Publié</>
        : <><ToggleLeft style={{ width: "11px", height: "11px" }} />Publier</>
      }
    </button>
  );
}
