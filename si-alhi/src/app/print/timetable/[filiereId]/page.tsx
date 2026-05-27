"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

const DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
const DAY_LABELS: Record<string, string> = {
  LUNDI: "Lundi", MARDI: "Mardi", MERCREDI: "Mercredi",
  JEUDI: "Jeudi", VENDREDI: "Vendredi", SAMEDI: "Samedi",
};
const TIME_SLOTS = [
  { label: "08h00 - 10h00", start: "08:00" },
  { label: "10h00 - 12h00", start: "10:00" },
  { label: "13h00 - 15h00", start: "13:00" },
  { label: "15h00 - 17h00", start: "15:00" },
];

type Schedule = {
  id: string;
  filiereId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: "COURS" | "TPE" | "EVALUATION" | "PAUSE";
  courseAssignment?: {
    course: { name: string; code: string };
    teacher: { firstName: string; lastName: string };
  } | null;
  room?: { name: string; code: string } | null;
  sessionNumber?: number | null;
};

type Filiere = { id: string; code: string; name: string };

function typeColor(type: string): { bg: string; border: string; text: string } {
  switch (type) {
    case "COURS": return { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" };
    case "TPE": return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
    case "EVALUATION": return { bg: "#ffedd5", border: "#fdba74", text: "#9a3412" };
    case "PAUSE": return { bg: "#f3f4f6", border: "#d1d5db", text: "#4b5563" };
    default: return { bg: "#f9fafb", border: "#e5e7eb", text: "#374151" };
  }
}

function typeLabel(type: string): string {
  const m: Record<string, string> = { COURS: "Cours", TPE: "TPE", EVALUATION: "Evaluation", PAUSE: "Pause" };
  return m[type] ?? type;
}

export default function PrintTimetablePage() {
  const { filiereId } = useParams<{ filiereId: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "cours"; // "cours" or "examens"
  const year = searchParams.get("year") ?? "2025-2026";

  const [filiere, setFiliere] = useState<Filiere | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/filieres").then((r) => r.ok ? r.json() : []),
      fetch(`/api/schedules?filiereId=${filiereId}&academicYear=${year}`).then((r) => r.ok ? r.json() : []),
    ]).then(([filieres, scheds]: [Filiere[], Schedule[]]) => {
      const f = filieres.find((f: Filiere) => f.id === filiereId);
      setFiliere(f ?? null);
      setSchedules(scheds);
    }).finally(() => setLoading(false));
  }, [filiereId, year]);

  const filtered = mode === "examens"
    ? schedules.filter((s) => s.type === "EVALUATION")
    : schedules.filter((s) => s.type !== "EVALUATION");

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif", color: "#888" }}>Chargement...</div>;
  }

  if (!filiere) {
    return <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif", color: "#B91C2F" }}>Filiere introuvable.</div>;
  }

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .page { box-shadow: none !important; margin: 0 !important; padding: 10mm 12mm !important; }
          @page { size: A4 landscape; margin: 8mm; }
          table { font-size: 9px !important; }
        }
        body { background: #e0e0e0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
        .page { background: white; max-width: 297mm; margin: 16px auto; padding: 12mm; box-shadow: 0 6px 32px rgba(0,0,0,0.18); }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1A1A1A; color: white; padding: 7px 8px; text-align: center; font-size: 10px; font-weight: 700; border: 1px solid #111; text-transform: uppercase; letter-spacing: 0.3px; }
        td { border: 1px solid #ccc; padding: 4px; vertical-align: top; height: 60px; }
        td.time-col { background: #f3f4f6; font-weight: 700; font-size: 9px; color: #555; text-align: center; vertical-align: middle; height: auto; width: 60px; white-space: nowrap; }
        .slot { border-radius: 4px; padding: 4px 5px; margin-bottom: 2px; font-size: 9px; }
        .pause-row td { background: #fff7ed; height: auto; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 100, background: "#1A1A1A", padding: "9px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: "#aaa", fontFamily: "sans-serif", fontSize: "12px" }}>
          {mode === "examens" ? "Planning des Examens" : "Emploi du Temps"} : {filiere.name} | {year}
        </span>
        <button
          onClick={() => window.print()}
          style={{ marginLeft: "auto", background: "#B91C2F", color: "white", border: "none", padding: "7px 22px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", fontFamily: "sans-serif" }}
        >
          Imprimer / PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontFamily: "sans-serif" }}
        >
          Fermer
        </button>
      </div>

      <div className="page">
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "10px", paddingBottom: "8px", borderBottom: "2px solid #1A1A1A", marginBottom: "8px" }}>
          <div style={{ fontSize: "8px", textAlign: "center", lineHeight: "1.6" }}>
            <div style={{ fontWeight: "900", fontSize: "9px", textTransform: "uppercase" }}>REPUBLIQUE DU CAMEROUN</div>
            <div style={{ fontStyle: "italic" }}>Paix - Travail - Patrie</div>
            <div style={{ borderTop: "1px solid #ccc", margin: "4px 0" }} />
            <div style={{ fontWeight: "700", textTransform: "uppercase", fontSize: "8px" }}>Ministere des Enseignements Superieurs</div>
            <div style={{ borderTop: "1px solid #ccc", margin: "4px 0" }} />
            <div style={{ fontWeight: "800", color: "#B91C2F", textTransform: "uppercase", fontSize: "8.5px" }}>Africa Leadership Higher Institute</div>
            <div style={{ color: "#555" }}>Chateau Ngoa Ekele, Yaounde</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ALHI" style={{ width: "60px", height: "60px", objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div style={{ fontSize: "8px", textAlign: "center", lineHeight: "1.6" }}>
            <div style={{ fontWeight: "900", fontSize: "9px", textTransform: "uppercase" }}>REPUBLIC OF CAMEROON</div>
            <div style={{ fontStyle: "italic" }}>Peace - Work - Fatherland</div>
            <div style={{ borderTop: "1px solid #ccc", margin: "4px 0" }} />
            <div style={{ fontWeight: "700", textTransform: "uppercase", fontSize: "8px" }}>Ministry of Higher Education</div>
            <div style={{ borderTop: "1px solid #ccc", margin: "4px 0" }} />
            <div style={{ fontWeight: "800", color: "#B91C2F", textTransform: "uppercase", fontSize: "8.5px" }}>Africa Leadership Higher Institute</div>
            <div style={{ color: "#555" }}>info@africaleadershipinstitute.com</div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "10px", padding: "5px 0", borderBottom: "1px solid #ccc" }}>
          <div style={{ fontSize: "13px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px" }}>
            {mode === "examens" ? "Planning des Examens" : "Emploi du Temps des Cours"}
          </div>
          <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>
            Filiere : {filiere.name} ({filiere.code}) | Annee Academique {year} | Semestre 1
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "8px", fontSize: "9px", flexWrap: "wrap" }}>
          {["COURS", "TPE", "EVALUATION", "PAUSE"].map((t) => {
            const c = typeColor(t);
            return (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "12px", height: "10px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: "2px" }} />
                <span style={{ color: "#555" }}>{typeLabel(t)}</span>
              </div>
            );
          })}
        </div>

        {/* Timetable grid */}
        <table>
          <thead>
            <tr>
              <th style={{ width: "60px" }}>Horaire</th>
              {DAYS.map((d) => <th key={d}>{DAY_LABELS[d]}</th>)}
            </tr>
          </thead>
          <tbody>
            {/* Pause row */}
            <tr className="pause-row">
              <td className="time-col">12h - 13h</td>
              <td colSpan={6} style={{ textAlign: "center", fontSize: "9px", color: "#b45309", fontStyle: "italic", height: "22px", verticalAlign: "middle" }}>
                Pause dejeuner / Lunch break
              </td>
            </tr>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot.start}>
                <td className="time-col">{slot.label}</td>
                {DAYS.map((day) => {
                  const slots = filtered.filter((s) => s.dayOfWeek === day && s.startTime === slot.start);
                  return (
                    <td key={day}>
                      {slots.map((s) => {
                        const c = typeColor(s.type);
                        return (
                          <div key={s.id} className="slot" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                            <div style={{ fontWeight: "700", fontSize: "8px" }}>
                              {s.courseAssignment ? s.courseAssignment.course.code : typeLabel(s.type)}
                            </div>
                            {s.courseAssignment && (
                              <div style={{ fontSize: "8px", opacity: 0.9 }}>{s.courseAssignment.course.name.slice(0, 20)}</div>
                            )}
                            {s.courseAssignment && (
                              <div style={{ fontSize: "7.5px", opacity: 0.75 }}>{s.courseAssignment.teacher.lastName}</div>
                            )}
                            {s.room && (
                              <div style={{ fontSize: "7.5px", opacity: 0.75, fontStyle: "italic" }}>Salle : {s.room.code}</div>
                            )}
                            {s.sessionNumber && (
                              <div style={{ fontSize: "7.5px", opacity: 0.75 }}>Session {s.sessionNumber}</div>
                            )}
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#999", borderTop: "1px solid #eee", paddingTop: "6px" }}>
          <span>Africa Leadership Higher Institute - Yaounde, Cameroun</span>
          <span>Edite le {new Date().toLocaleDateString("fr-FR")}</span>
        </div>
      </div>
    </>
  );
}
