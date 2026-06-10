"use client";
import { useState } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";

interface PvPublishToggleProps {
  filiereId: string;
  initialPublished: boolean;
  filiereName: string;
}

export function PvPublishToggle({ filiereId, initialPublished, filiereName }: PvPublishToggleProps) {
  const [published, setPublished] = useState(initialPublished);
  const [toggling, setToggling] = useState(false);

  async function toggle() {
    setToggling(true);
    const res = await fetch(`/api/filieres/${filiereId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pvPublished: !published }),
    });
    if (res.ok) setPublished(!published);
    setToggling(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={toggling}
      title={published ? `PV de ${filiereName} visibles` : `Publier les PV de ${filiereName}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 10px",
        background: published ? "#16a34a" : "transparent",
        color: published ? "white" : "#6b7280",
        border: `1px solid ${published ? "#16a34a" : "#d1d5db"}`,
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: "600",
        cursor: toggling ? "not-allowed" : "pointer",
        opacity: toggling ? 0.7 : 1,
        transition: "all 0.15s",
      }}
    >
      {published
        ? <><ToggleRight style={{ width: "13px", height: "13px" }} />PV publiés</>
        : <><ToggleLeft style={{ width: "13px", height: "13px" }} />Publier PV</>
      }
    </button>
  );
}
