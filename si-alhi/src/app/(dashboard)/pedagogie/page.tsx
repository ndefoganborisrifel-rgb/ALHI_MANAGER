"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Plus, Trash2, Calendar, ChevronLeft, ChevronRight, Printer, X, Eye } from "lucide-react";
import { useCanManage } from "@/components/providers/RoleProvider";

type Filiere = { id: string; code: string; name: string };
type Room = { id: string; code: string; name: string; capacity?: number };
type CourseAssignment = {
  id: string;
  course: { id: string; name: string; code: string; filiereId: string };
  teacher: { id: string; firstName: string; lastName: string };
};
type Schedule = {
  id: string;
  filiereId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: string;
  semester: number;
  roomId?: string | null;
  courseAssignmentId?: string | null;
  sessionNumber?: number | null;
  totalSessions?: number | null;
  label?: string | null;
  courseAssignment?: {
    course: { name: string; code: string };
    teacher: { id: string; firstName: string; lastName: string };
  } | null;
  room?: { name: string; code: string } | null;
  filiere: { name: string; code: string };
};

const DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
const DAY_FR: Record<string, string> = { LUNDI: "Lundi", MARDI: "Mardi", MERCREDI: "Mercredi", JEUDI: "Jeudi", VENDREDI: "Vendredi", SAMEDI: "Samedi" };
const DAY_JS: Record<number, string> = { 1: "LUNDI", 2: "MARDI", 3: "MERCREDI", 4: "JEUDI", 5: "VENDREDI", 6: "SAMEDI", 0: "DIMANCHE" };

const TIME_SLOTS = [
  { label: "08h00", end: "10h00", start: "08:00", endRaw: "10:00" },
  { label: "10h00", end: "12h00", start: "10:00", endRaw: "12:00" },
  { label: "13h20", end: "15h20", start: "13:20", endRaw: "15:20" },
  { label: "15h20", end: "17h20", start: "15:20", endRaw: "17:20" },
];

const TYPE_STYLE: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  COURS:      { bg: "#e0f2fe", border: "#7dd3fc", text: "#0c4a6e", dot: "#0ea5e9",  label: "Cours" },
  TPE:        { bg: "#dcfce7", border: "#86efac", text: "#14532d", dot: "#22c55e",  label: "TPE" },
  EVALUATION: { bg: "#fef3c7", border: "#fcd34d", text: "#78350f", dot: "#f59e0b",  label: "Evaluation" },
  PAUSE:      { bg: "#f3f4f6", border: "#d1d5db", text: "#6b7280", dot: "#9ca3af",  label: "Pause" },
  FERIER:     { bg: "#f3e8ff", border: "#d8b4fe", text: "#581c87", dot: "#a855f7",  label: "Ferie" },
  EXCURSION:  { bg: "#ecfdf5", border: "#6ee7b7", text: "#064e3b", dot: "#10b981",  label: "Excursion" },
  AUTRE:      { bg: "#f8fafc", border: "#cbd5e1", text: "#475569", dot: "#94a3b8",  label: "Autre" },
};

const EMPTY_FORM = {
  type: "COURS",
  dayOfWeek: "LUNDI",
  startTime: "08:00",
  endTime: "10:00",
  roomId: "",
  courseAssignmentId: "",
  sessionNumber: "",
  totalSessions: "",
  label: "",
  semester: "1",
};

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function fmtDateLong(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function PedagogiePage() {
  const canManage = useCanManage();
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFiliereId, setActiveFiliereId] = useState("");
  const [activeTab, setActiveTab] = useState<"emploi" | "examens">("emploi");
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [collisionWarn, setCollisionWarn] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [fRes, rRes, aRes, sRes] = await Promise.all([
        fetch("/api/filieres"),
        fetch("/api/rooms"),
        fetch("/api/course-assignments?academicYear=2025-2026"),
        fetch("/api/schedules?academicYear=2025-2026"),
      ]);
      const [f, r, a, s] = await Promise.all([
        fRes.ok ? fRes.json() : [],
        rRes.ok ? rRes.json() : [],
        aRes.ok ? aRes.json() : [],
        sRes.ok ? sRes.json() : [],
      ]);
      setFilieres(f);
      setRooms(r);
      setAssignments(a);
      setSchedules(s);
      if (f.length > 0 && !activeFiliereId) setActiveFiliereId(f[0].id);
    } finally {
      setLoading(false);
    }
  }, [activeFiliereId]);

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Collision detection: meme salle OU meme enseignant, meme jour, meme heure
  const collisions = new Set<string>();
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i], b = schedules[j];
      if (a.dayOfWeek !== b.dayOfWeek || a.startTime !== b.startTime) continue;
      // Collision salle
      if (a.roomId && a.roomId === b.roomId) { collisions.add(a.id); collisions.add(b.id); }
      // Collision enseignant
      const ta = a.courseAssignment?.teacher?.id;
      const tb = b.courseAssignment?.teacher?.id;
      if (ta && ta === tb) { collisions.add(a.id); collisions.add(b.id); }
      // Collision filiere (meme groupe, meme heure)
      if (a.filiereId === b.filiereId) { collisions.add(a.id); collisions.add(b.id); }
    }
  }

  const filiere = filieres.find((f) => f.id === activeFiliereId);
  const filiereSchedules = schedules.filter((s) => s.filiereId === activeFiliereId);
  const coursSlots = filiereSchedules.filter((s) => s.type !== "EVALUATION");
  const examSlots = filiereSchedules.filter((s) => s.type === "EVALUATION");
  const filiereAssignments = assignments.filter((a) => a.course.filiereId === activeFiliereId);
  const totalCollisions = collisions.size / 2;

  // Demain
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = DAY_JS[tomorrow.getDay()];
  const tomorrowSlots = filiereSchedules.filter((s) => s.dayOfWeek === tomorrowDay && s.type !== "EVALUATION");
  const tomorrowFirst = tomorrowSlots.length > 0 ? TIME_SLOTS.find((t) => t.start === tomorrowSlots[0]?.startTime) : null;
  const tomorrowLast = tomorrowSlots.length > 0 ? TIME_SLOTS.find((t) => t.start === tomorrowSlots[tomorrowSlots.length - 1]?.startTime) : null;

  async function deleteSlot(id: string) {
    if (!confirm("Supprimer ce creneau ?")) return;
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? "Erreur"); return; }
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setFormError(""); setCollisionWarn(false);
    try {
      const endSlot = TIME_SLOTS.find((t) => t.start === form.startTime);
      const endTime = endSlot ? endSlot.endRaw : form.endTime;
      const payload = {
        filiereId: activeFiliereId,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime,
        type: form.type,
        academicYear: "2025-2026",
        semester: parseInt(form.semester),
        roomId: form.roomId || undefined,
        courseAssignmentId: (form.type === "COURS" || form.type === "TPE" || form.type === "EVALUATION") ? (form.courseAssignmentId || undefined) : undefined,
        sessionNumber: form.sessionNumber ? parseInt(form.sessionNumber) : undefined,
        totalSessions: form.totalSessions ? parseInt(form.totalSessions) : undefined,
        label: form.label.trim() || undefined,
      };
      const res = await fetch("/api/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        if (data.collision) { setCollisionWarn(true); setFormError(data.error); }
        else setFormError(data.error ?? "Erreur.");
        return;
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      const sRes = await fetch("/api/schedules?academicYear=2025-2026");
      if (sRes.ok) setSchedules(await sRes.json());
    } finally { setSubmitting(false); }
  }

  function openModal() { setForm({ ...EMPTY_FORM }); setFormError(""); setCollisionWarn(false); setShowModal(true); }

  const weekEnd = addDays(weekStart, 5);

  function renderGrid(slotsList: Schedule[]) {
    const dayDates: Record<string, string> = {};
    DAYS.forEach((day, i) => { dayDates[day] = fmtDate(addDays(weekStart, i)); });

    const th: React.CSSProperties = {
      padding: "8px 6px", color: "white", textAlign: "center", fontSize: "11px",
      fontWeight: "700", border: "1px solid #333", whiteSpace: "nowrap",
    };
    const tdTime: React.CSSProperties = {
      padding: "6px 8px", background: "#1A1A1A", color: "rgba(255,255,255,0.85)",
      fontSize: "11px", fontWeight: "700", textAlign: "center", verticalAlign: "middle",
      border: "1px solid #2a2a2a", whiteSpace: "nowrap", minWidth: "72px",
    };

    return (
      <div style={{ overflowX: "auto", position: "relative" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", position: "relative", zIndex: 1 }}>
          <thead>
            <tr style={{ background: "#1A1A1A" }}>
              <th style={{ ...th, width: "72px" }}>Horaire</th>
              {DAYS.map((d) => (
                <th key={d} style={{ ...th, minWidth: "140px" }}>
                  <div>{DAY_FR[d]}</div>
                  <div style={{ fontSize: "9px", fontWeight: "400", opacity: 0.55, marginTop: "1px" }}>{dayDates[d]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot, idx) => (
              <React.Fragment key={slot.start}>
                {idx === 2 && (
                  <tr>
                    <td colSpan={7} style={{ background: "linear-gradient(90deg, #fff7ed, #fffbf5, #fff7ed)", border: "1px solid #fed7aa", padding: "5px 10px", textAlign: "center", fontSize: "10px", fontWeight: "800", color: "#c2410c", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                      Pause dejeuner : 12h00 - 13h15
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={tdTime}>
                    <div>{slot.label}</div>
                    <div style={{ fontSize: "9px", opacity: 0.5, fontWeight: "400", marginTop: "1px" }}>{slot.end}</div>
                  </td>
                  {DAYS.map((day) => {
                    const matching = slotsList.filter((s) => s.dayOfWeek === day && s.startTime === slot.start);
                    return (
                      <td key={day} style={{ border: "1px solid var(--border)", padding: "4px", verticalAlign: "top", minHeight: "70px" }}>
                        {matching.map((s) => {
                          const hasCol = collisions.has(s.id);
                          const style = hasCol
                            ? { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", dot: "#ef4444", label: "Collision" }
                            : (TYPE_STYLE[s.type] ?? TYPE_STYLE.COURS);
                          return (
                            <div key={s.id} className="slot-card" style={{ background: style.bg, border: `1.5px solid ${style.border}`, borderRadius: "7px", padding: "5px 7px", marginBottom: "3px", position: "relative", fontSize: "11px" }}>
                              {hasCol && (
                                <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "#991b1b", fontSize: "9px", fontWeight: "700", marginBottom: "2px" }}>
                                  <AlertTriangle style={{ width: "9px", height: "9px" }} />Collision
                                </div>
                              )}
                              {s.label && !s.courseAssignment && (
                                <div style={{ fontWeight: "800", fontSize: "10px", color: style.text, lineHeight: 1.3 }}>{s.label}</div>
                              )}
                              {s.courseAssignment ? (
                                <>
                                  <div style={{ fontWeight: "800", fontSize: "10px", color: style.text, lineHeight: 1.3 }}>{s.courseAssignment.course.code}</div>
                                  <div style={{ fontSize: "10px", color: style.text, opacity: 0.9, lineHeight: 1.3, marginTop: "1px" }}>{s.courseAssignment.course.name}</div>
                                  <div style={{ fontSize: "9px", color: style.text, opacity: 0.65, marginTop: "2px", fontStyle: "italic" }}>
                                    {s.courseAssignment.teacher.lastName} {s.courseAssignment.teacher.firstName[0]}.
                                  </div>
                                </>
                              ) : (
                                !s.label && <div style={{ fontWeight: "700", fontSize: "11px", color: style.text }}>{style.label}</div>
                              )}
                              {s.room && (
                                <div style={{ fontSize: "8px", color: style.text, opacity: 0.6, marginTop: "1px" }}>Salle : {s.room.code}</div>
                              )}
                              {s.sessionNumber && (
                                <div style={{ fontSize: "8px", color: style.text, opacity: 0.75, fontWeight: "700" }}>
                                  Seance {s.sessionNumber}{s.totalSessions ? `/${s.totalSessions}` : ""}
                                </div>
                              )}
                              {canManage && (
                                <button
                                  onClick={() => deleteSlot(s.id)}
                                  className="del-btn"
                                  style={{ position: "absolute", top: "3px", right: "3px", background: "rgba(185,28,47,0.12)", border: "none", borderRadius: "4px", cursor: "pointer", color: "#B91C2F", padding: "2px", display: "flex", alignItems: "center", opacity: 0, transition: "opacity 0.15s" }}
                                >
                                  <Trash2 style={{ width: "10px", height: "10px" }} />
                                </button>
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
    );
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "220px", color: "var(--text-muted)", fontSize: "14px" }}>
      Chargement du planning...
    </div>
  );

  return (
    <>
      <style>{`
        .slot-card:hover .del-btn { opacity: 1 !important; }
        .slot-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        .week-nav-btn { background: var(--bg-muted); border: 1.5px solid var(--border); border-radius: 7px; cursor: pointer; color: var(--text); padding: 5px 8px; display: flex; align-items: center; }
        .week-nav-btn:hover { background: var(--bg-card-hover); }
        .tab-btn { padding: 7px 16px; border-radius: 8px; border: 1.5px solid transparent; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .filiere-btn { padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text); transition: all 0.15s; }
        .filiere-btn.active { background: #1A1A1A; border-color: #1A1A1A; color: white; }
        .filiere-btn:hover:not(.active) { border-color: #B91C2F; color: #B91C2F; }
        .form-input { width: 100%; padding: 9px 12px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 13px; background: var(--bg-card); color: var(--text); outline: none; box-sizing: border-box; }
        .form-input:focus { border-color: #B91C2F; }
        .form-label { display: block; font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.4px; }
      `}</style>

      <div style={{ maxWidth: "1400px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text)", marginBottom: "2px" }}>SI-Pedagogie</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Emploi du temps et plannings d&apos;examens, 2025-2026</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Demain banner */}
            {tomorrowSlots.length > 0 && tomorrowFirst && tomorrowLast && (
              <div style={{ display: "flex", alignItems: "center", gap: "7px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "10px", padding: "7px 12px" }}>
                <Calendar style={{ width: "13px", height: "13px", color: "#2563eb" }} />
                <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#1e40af" }}>
                  Demain : {tomorrowFirst.label} a {tomorrowLast.end} ({tomorrowSlots.length} cours)
                </span>
              </div>
            )}
            {totalCollisions > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "8px 14px" }}>
                <AlertTriangle style={{ width: "14px", height: "14px", color: "#dc2626" }} />
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#991b1b" }}>{totalCollisions} collision{totalCollisions > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "18px" }}>
          {[
            { label: "Creneaux", value: schedules.length, color: "#2563eb" },
            { label: "Collisions", value: totalCollisions, color: "#B91C2F" },
            { label: "Salles", value: rooms.length, color: "#16a34a" },
            { label: "Filieres", value: filieres.length, color: "#7c3aed" },
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "14px 16px", border: "1px solid var(--border)", textAlign: "center" }}>
              <p style={{ fontSize: "26px", fontWeight: "800", color: kpi.color, lineHeight: 1 }}>{kpi.value}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
          {Object.entries(TYPE_STYLE).map(([type, s]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 10px", background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: "20px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.dot }} />
              <span style={{ fontSize: "11px", fontWeight: "600", color: s.text }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filiere tabs */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
          {filieres.map((f) => (
            <button key={f.id} className={`filiere-btn${activeFiliereId === f.id ? " active" : ""}`} onClick={() => setActiveFiliereId(f.id)}>
              {f.code}
              <span style={{ fontSize: "10px", fontWeight: "400", marginLeft: "4px", opacity: 0.7 }}>{f.name}</span>
            </button>
          ))}
        </div>

        {filiere && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", gap: "12px", flexWrap: "wrap" }}>
              {/* Sub-tabs */}
              <div style={{ display: "flex", gap: "4px", background: "var(--bg-muted)", borderRadius: "9px", padding: "4px" }}>
                {[
                  { key: "emploi", label: `Emploi du temps (${coursSlots.length})` },
                  { key: "examens", label: `Planning examens (${examSlots.length})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    className="tab-btn"
                    onClick={() => setActiveTab(tab.key as "emploi" | "examens")}
                    style={{ background: activeTab === tab.key ? "var(--bg-card)" : "transparent", color: activeTab === tab.key ? "var(--text)" : "var(--text-muted)", borderColor: activeTab === tab.key ? "var(--border)" : "transparent", boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button className="week-nav-btn" onClick={() => setWeekStart(d => addDays(d, -7))}>
                  <ChevronLeft style={{ width: "13px", height: "13px" }} />
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "12px", color: "var(--text)", fontWeight: "600", whiteSpace: "nowrap" }}>
                  <Calendar style={{ width: "12px", height: "12px", color: "var(--text-muted)" }} />
                  {fmtDateLong(weekStart)} au {fmtDateLong(weekEnd)}
                </div>
                <button className="week-nav-btn" onClick={() => setWeekStart(d => addDays(d, 7))}>
                  <ChevronRight style={{ width: "13px", height: "13px" }} />
                </button>
                <button
                  onClick={() => window.open(`/print/timetable/${activeFiliereId}?mode=${activeTab === "examens" ? "examens" : "cours"}&year=2025-2026&weekStart=${weekStart.toISOString().slice(0, 10)}`, "_blank")}
                  style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "12px", fontWeight: "600", color: "var(--text)", cursor: "pointer" }}
                >
                  <Printer style={{ width: "12px", height: "12px" }} />Imprimer
                </button>
                {canManage ? (
                  <button
                    onClick={openModal}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 16px", background: "#B91C2F", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", color: "white", cursor: "pointer" }}
                  >
                    <Plus style={{ width: "13px", height: "13px" }} />Ajouter
                  </button>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", background: "var(--bg-muted)", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" }}>
                    <Eye style={{ width: "12px", height: "12px" }} />Lecture seule
                  </span>
                )}
              </div>
            </div>

            {/* Timetable card */}
            <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
                <Calendar style={{ width: "15px", height: "15px", color: "#B91C2F" }} />
                <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>{filiere.name}</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Semaine du {fmtDateLong(weekStart)} au {fmtDateLong(weekEnd)}
                </span>
              </div>
              <div style={{ padding: "12px" }}>
                {renderGrid(activeTab === "emploi" ? coursSlots : examSlots)}
              </div>
              {/* Disclaimer */}
              <div style={{ padding: "10px 18px", borderTop: "1px solid var(--border)", background: "var(--bg-muted)" }}>
                <p style={{ fontSize: "10.5px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>
                  Cet emploi du temps est susceptible de changer independamment de la volonte des differents intervenants.
                </p>
              </div>
            </div>

            {canManage && filiereAssignments.length === 0 && (
              <div style={{ marginTop: "10px", padding: "10px 14px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "8px", fontSize: "12px", color: "#92400e" }}>
                Aucun cours assigne pour cette filiere. Allez dans RH pour affecter des enseignants avant d&apos;ajouter des creneaux.
              </div>
            )}
          </div>
        )}

        {filieres.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Aucune filiere configuree.</div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} onClick={() => setShowModal(false)}>
          <div style={{ background: "var(--bg-card)", borderRadius: "16px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text)" }}>Ajouter un creneau</h2>
                {filiere && <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Filiere : {filiere.name}</p>}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Type + Jour */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label className="form-label">Type de creneau</label>
                  <select className="form-input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    <option value="COURS">Cours</option>
                    <option value="TPE">TPE</option>
                    <option value="EVALUATION">Evaluation</option>
                    <option value="PAUSE">Pause</option>
                    <option value="FERIER">Jour ferie</option>
                    <option value="EXCURSION">Excursion</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Jour</label>
                  <select className="form-input" value={form.dayOfWeek} onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))}>
                    {DAYS.map((d) => <option key={d} value={d}>{DAY_FR[d]}</option>)}
                  </select>
                </div>
              </div>

              {/* Heure + Semestre */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label className="form-label">Heure de debut</label>
                  <select className="form-input" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}>
                    {TIME_SLOTS.map((t) => (
                      <option key={t.start} value={t.start}>{t.label}</option>
                    ))}
                    <option value="custom">Autre heure...</option>
                  </select>
                  {form.startTime === "custom" && (
                    <input type="time" className="form-input" style={{ marginTop: "6px" }} value="" onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
                  )}
                </div>
                <div>
                  <label className="form-label">Heure de fin</label>
                  <select className="form-input" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}>
                    {TIME_SLOTS.map((t) => (
                      <option key={t.endRaw} value={t.endRaw}>{t.end}</option>
                    ))}
                    <option value="custom">Autre heure...</option>
                  </select>
                  {form.endTime === "custom" && (
                    <input type="time" className="form-input" style={{ marginTop: "6px" }} value="" onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
                  )}
                </div>
                <div>
                  <label className="form-label">Semestre</label>
                  <select className="form-input" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}>
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                      <option key={s} value={String(s)}>S{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salle */}
              <div>
                <label className="form-label">Salle</label>
                <select className="form-input" value={form.roomId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}>
                  <option value="">Aucune salle</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.code} - {r.name}{r.capacity ? ` (${r.capacity} pl.)` : ""}</option>)}
                </select>
              </div>

              {/* Cours assigne (pour COURS, TPE, EVALUATION) */}
              {(form.type === "COURS" || form.type === "TPE" || form.type === "EVALUATION") && (
                <div>
                  <label className="form-label">Matiere / Cours assigne</label>
                  <select className="form-input" value={form.courseAssignmentId} onChange={(e) => setForm((f) => ({ ...f, courseAssignmentId: e.target.value }))}>
                    <option value="">Selectionner un cours...</option>
                    {filiereAssignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.course.code} - {a.course.name} ({a.teacher.lastName} {a.teacher.firstName[0]}.)
                      </option>
                    ))}
                  </select>
                  {filiereAssignments.length === 0 && (
                    <p style={{ fontSize: "11px", color: "#d97706", marginTop: "4px" }}>Aucun cours assigne. Creez des affectations dans RH.</p>
                  )}
                </div>
              )}

              {/* Seance X/Y et libelle (pour EVALUATION et autres types) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label className="form-label">No. seance (ex: 2)</label>
                  <input type="number" min={1} className="form-input" value={form.sessionNumber} onChange={(e) => setForm((f) => ({ ...f, sessionNumber: e.target.value }))} placeholder="ex: 2" />
                </div>
                <div>
                  <label className="form-label">Total seances (ex: 4)</label>
                  <input type="number" min={1} className="form-input" value={form.totalSessions} onChange={(e) => setForm((f) => ({ ...f, totalSessions: e.target.value }))} placeholder="ex: 4" />
                </div>
              </div>

              {/* Libelle libre (pour FERIER, EXCURSION, AUTRE) */}
              {(form.type === "FERIER" || form.type === "EXCURSION" || form.type === "AUTRE") && (
                <div>
                  <label className="form-label">Intitule / Description</label>
                  <input type="text" className="form-input" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder={form.type === "FERIER" ? "ex: Fete Nationale" : form.type === "EXCURSION" ? "ex: Visite entreprise XYZ" : "ex: Rattrapage"} />
                </div>
              )}

              {collisionWarn && (
                <div style={{ display: "flex", gap: "8px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 12px" }}>
                  <AlertTriangle style={{ width: "14px", height: "14px", color: "#dc2626", flexShrink: 0, marginTop: "1px" }} />
                  <p style={{ fontSize: "12px", color: "#991b1b" }}>{formError}</p>
                </div>
              )}
              {formError && !collisionWarn && <p style={{ fontSize: "12px", color: "#B91C2F" }}>{formError}</p>}

              <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "10px", background: "var(--bg-muted)", border: "1.5px solid var(--border)", borderRadius: "9px", fontSize: "13px", fontWeight: "600", color: "var(--text)", cursor: "pointer" }}>Annuler</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: "10px", background: "#B91C2F", border: "none", borderRadius: "9px", fontSize: "13px", fontWeight: "700", color: "white", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Enregistrement..." : "Ajouter le creneau"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
