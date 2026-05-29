"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Send } from "lucide-react";

interface Props {
  filiereId: string;
  filiereName: string;
  published: boolean;
}

export function PublishPvButton({ filiereId, filiereName, published }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(published);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const msg = current
      ? `Retirer la publication du PV pour ${filiereName} ? Les etudiants n'y auront plus acces.`
      : `Publier le PV de deliberation pour ${filiereName} ? Les etudiants et parents seront notifies.`;
    if (!confirm(msg)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/filieres/${filiereId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pvPublished: !current }),
      });
      if (res.ok) {
        setCurrent(!current);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (current) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          padding: "5px 12px", borderRadius: "7px", border: "1.5px solid #16a34a",
          background: "#f0fdf4", color: "#15803d", fontSize: "11px", fontWeight: "700",
          cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
        }}
        title="Cliquer pour retirer la publication"
      >
        <CheckCircle style={{ width: "12px", height: "12px" }} />
        PV publie
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "5px 12px", borderRadius: "7px", border: "none",
        background: "#B91C2F", color: "white", fontSize: "11px", fontWeight: "700",
        cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
      }}
    >
      <Send style={{ width: "12px", height: "12px" }} />
      {loading ? "Publication..." : "Publier le PV"}
    </button>
  );
}
