"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

const DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
const DAY_LABELS: Record<string, string> = {
  LUNDI: "Lundi", MARDI: "Mardi", MERCREDI: "Mercredi",
  JEUDI: "Jeudi", VENDREDI: "Vendredi", SAMEDI: "Samedi",
};
const TIME_SLOTS = [
  { label: "08h00 - 10h00", start: "08:00" },
  { label: "10h00 - 12h00", start: "10:00" },
  { label: "13h20 - 15h20", start: "13:20" },
  { label: "15h20 - 17h20", start: "15:20" },
];

type Schedule = {
  id: string;
  filiereId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: string;
  sessionNumber?: number | null;
  totalSessions?: number | null;
  label?: string | null;
  courseAssignment?: {
    course: { name: string; code: string };
    teacher: { firstName: string; lastName: string };
  } | null;
  room?: { name: string; code: string } | null;
};

type Filiere = { id: string; code: string; name: string };

function typeColor(type: string): { bg: string; border: string; text: string } {
  switch (type) {
    case "COURS":      return { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" };
    case "TPE":        return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
    case "EVALUATION": return { bg: "#ffedd5", border: "#fdba74", text: "#9a3412" };
    case "PAUSE":      return { bg: "#f3f4f6", border: "#d1d5db", text: "#4b5563" };
    case "FERIER":     return { bg: "#f3e8ff", border: "#d8b4fe", text: "#581c87" };
    case "EXCURSION":  return { bg: "#ecfdf5", border: "#6ee7b7", text: "#064e3b" };
    default:           return { bg: "#f8fafc", border: "#cbd5e1", text: "#475569" };
  }
}

function typeLabel(type: string): string {
  const m: Record<string, string> = { COURS: "Cours", TPE: "TPE", EVALUATION: "Evaluation", PAUSE: "Pause", FERIER: "Ferie", EXCURSION: "Excursion", AUTRE: "Autre" };
  return m[type] ?? type;
}

export default function PrintTimetablePage() {
  const { filiereId } = useParams<{ filiereId: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "cours";
  const year = searchParams.get("year") ?? "2025-2026";
  const semester = searchParams.get("semester") ?? "";

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

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif", color: "#888" }}>Chargement...</div>;
  if (!filiere) return <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif", color: "#B91C2F" }}>Filiere introuvable.</div>;

  const dateEdition = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: #1A1A1A !important; }
          .page { box-shadow: none !important; margin: 0 !important; padding: 10mm 12mm !important; background: white !important; }
          @page { size: A4 landscape; margin: 8mm; }
          table { font-size: 9px !important; }
          th { background: #1A1A1A !important; color: white !important; }
          td { border-color: #ccc !important; color: #1A1A1A !important; background: white !important; }
          td.time-col { background: #f3f4f6 !important; color: #555 !important; }
          .pause-row td { background: #fff7ed !important; }
          .slot { background: white !important; border: 1px solid #ccc !important; color: #1A1A1A !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .watermark {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) rotate(-35deg) !important;
            opacity: 0.06 !important;
            z-index: 0 !important;
            pointer-events: none !important;
            width: 180mm !important;
          }
        }
        body { background: #e0e0e0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
        .page { background: white; max-width: 297mm; margin: 16px auto; padding: 12mm; box-shadow: 0 6px 32px rgba(0,0,0,0.18); position: relative; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1A1A1A; color: white; padding: 7px 8px; text-align: center; font-size: 10px; font-weight: 700; border: 1px solid #111; text-transform: uppercase; letter-spacing: 0.3px; }
        td { border: 1px solid #ccc; padding: 4px; vertical-align: top; height: 60px; }
        td.time-col { background: #f3f4f6; font-weight: 700; font-size: 9px; color: #555; text-align: center; vertical-align: middle; height: auto; width: 60px; white-space: nowrap; }
        .slot { border-radius: 4px; padding: 4px 5px; margin-bottom: 2px; font-size: 9px; }
        .pause-row td { background: #fff7ed; height: auto; }
        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); opacity: 0.06; z-index: 0; pointer-events: none; width: 55%; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 100, background: "#1A1A1A", padding: "9px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: "#aaa", fontFamily: "sans-serif", fontSize: "12px" }}>
          {mode === "examens" ? "Planning des Examens" : "Emploi du Temps"} : {filiere.name} | {year}
        </span>
        <button onClick={() => window.print()} style={{ marginLeft: "auto", background: "#B91C2F", color: "white", border: "none", padding: "7px 22px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", fontFamily: "sans-serif" }}>
          Imprimer / PDF
        </button>
        <button onClick={() => window.close()} style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontFamily: "sans-serif" }}>
          Fermer
        </button>
      </div>

      <div className="page">
        {/* Filigrane logo oblique */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt=""
          className="watermark"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />

        {/* Header officiel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "10px", paddingBottom: "8px", marginBottom: "8px", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "8px", textAlign: "center", lineHeight: "1.6" }}>
            <div style={{ fontWeight: "900", fontSize: "9px", textTransform: "uppercase" }}>REPUBLIQUE DU CAMEROUN</div>
            <div style={{ fontStyle: "italic" }}>Paix - Travail - Patrie</div>
            <div style={{ height: "6px" }} />
            <div style={{ fontWeight: "700", textTransform: "uppercase", fontSize: "8px" }}>Ministere des Enseignements Superieurs</div>
            <div style={{ height: "6px" }} />
            <div style={{ fontWeight: "800", color: "#B91C2F", textTransform: "uppercase", fontSize: "8.5px" }}>Africa Leadership Higher Institute</div>
            <div style={{ color: "#555" }}>Chateau Ngoa Ekele, Yaounde</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="ALHI" style={{ width: "60px", height: "60px", objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div style={{ fontSize: "8px", textAlign: "center", lineHeight: "1.6" }}>
            <div style={{ fontWeight: "900", fontSize: "9px", textTransform: "uppercase" }}>REPUBLIC OF CAMEROON</div>
            <div style={{ fontStyle: "italic" }}>Peace - Work - Fatherland</div>
            <div style={{ height: "6px" }} />
            <div style={{ fontWeight: "700", textTransform: "uppercase", fontSize: "8px" }}>Ministry of Higher Education</div>
            <div style={{ height: "6px" }} />
            <div style={{ fontWeight: "800", color: "#B91C2F", textTransform: "uppercase", fontSize: "8.5px" }}>Africa Leadership Higher Institute</div>
            <div style={{ color: "#555" }}>info@africaleadershipinstitute.com</div>
          </div>
        </div>

        <div style={{ borderTop: "2px solid #1A1A1A", marginBottom: "8px" }} />

        <div style={{ textAlign: "center", marginBottom: "8px", padding: "4px 0", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px" }}>
            {mode === "examens" ? "Planning des Examens" : "Emploi du Temps des Cours"}
          </div>
          <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>
            Filiere : {filiere.name} ({filiere.code}) | Annee Academique {year}{semester ? ` | Semestre ${semester}` : ""}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "6px", fontSize: "9px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          {["COURS", "TPE", "EVALUATION", "PAUSE", "FERIER", "EXCURSION"].map((t) => {
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
        <div style={{ position: "relative", zIndex: 1 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>Horaire</th>
                {DAYS.map((d) => <th key={d}>{DAY_LABELS[d]}</th>)}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot, idx) => (
                <React.Fragment key={slot.start}>
                  {idx === 2 && (
                    <tr className="pause-row">
                      <td className="time-col">12h - 13h15</td>
                      <td colSpan={6} style={{ textAlign: "center", fontSize: "9px", color: "#b45309", fontStyle: "italic", height: "22px", verticalAlign: "middle" }}>
                        Pause dejeuner / Lunch break (12h00 - 13h15)
                      </td>
                    </tr>
                  )}
                  <tr>
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
                                  {s.label || (s.courseAssignment ? s.courseAssignment.course.code : typeLabel(s.type))}
                                </div>
                                {s.courseAssignment && (
                                  <div style={{ fontSize: "8px", opacity: 0.9 }}>{s.courseAssignment.course.name.slice(0, 22)}</div>
                                )}
                                {s.courseAssignment && (
                                  <div style={{ fontSize: "7.5px", opacity: 0.75 }}>{s.courseAssignment.teacher.lastName}</div>
                                )}
                                {s.room && (
                                  <div style={{ fontSize: "7.5px", opacity: 0.75, fontStyle: "italic" }}>Salle : {s.room.code}</div>
                                )}
                                {s.sessionNumber && (
                                  <div style={{ fontSize: "7.5px", fontWeight: "700" }}>
                                    Seance {s.sessionNumber}{s.totalSessions ? `/${s.totalSessions}` : ""}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: "10px", padding: "6px 10px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "4px", textAlign: "center", fontSize: "8px", color: "#92400e", fontStyle: "italic", position: "relative", zIndex: 1 }}>
          Cet emploi du temps est susceptible de changer independamment de la volonte des differents intervenants.
        </div>

        {/* Footer */}
        <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#999", borderTop: "1px solid #eee", paddingTop: "5px", position: "relative", zIndex: 1 }}>
          <span>Africa Leadership Higher Institute - Yaounde, Cameroun</span>
          <span>Edite le {dateEdition}</span>
        </div>
      </div>
    </>
  );
}
