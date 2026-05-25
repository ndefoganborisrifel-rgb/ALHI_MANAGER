"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AlertTriangle, Plus, Trash2, Calendar } from "lucide-react";

type Filiere = {
  id: string;
  code: string;
  name: string;
};

type Room = {
  id: string;
  code: string;
  name: string;
};

type CourseAssignment = {
  id: string;
  course: { id: string; name: string; filiereId: string };
  teacher: { firstName: string; lastName: string };
};

type Schedule = {
  id: string;
  filiereId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: "COURS" | "TPE" | "EVALUATION" | "PAUSE";
  roomId?: string | null;
  courseAssignmentId?: string | null;
  sessionNumber?: number | null;
  academicYear: string;
  semester: number;
  courseAssignment?: {
    course: { name: string };
    teacher: { firstName: string; lastName: string };
  } | null;
  room?: { name: string; code: string } | null;
  filiere: { name: string; code: string };
};

const DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
const DAY_LABELS: Record<string, string> = {
  LUNDI: "Lundi", MARDI: "Mardi", MERCREDI: "Mercredi",
  JEUDI: "Jeudi", VENDREDI: "Vendredi", SAMEDI: "Samedi",
};

const TIME_SLOTS = [
  { label: "8h00 - 10h00", start: "08:00", end: "10:00", morning: true },
  { label: "10h00 - 12h00", start: "10:00", end: "12:00", morning: true },
  { label: "13h00 - 15h00", start: "13:00", end: "15:00", morning: false },
  { label: "15h00 - 17h00", start: "15:00", end: "17:00", morning: false },
];

const emptySlotForm = {
  type: "COURS" as "COURS" | "TPE" | "EVALUATION" | "PAUSE",
  dayOfWeek: "LUNDI",
  startTime: "08:00",
  endTime: "10:00",
  roomId: "",
  courseAssignmentId: "",
  sessionNumber: "",
};

function getSlotStyle(type: string): string {
  switch (type) {
    case "COURS": return "bg-blue-50 border border-blue-200 text-blue-900";
    case "TPE": return "bg-green-50 border border-green-200 text-green-900";
    case "EVALUATION": return "bg-orange-50 border border-orange-200 text-orange-900";
    case "PAUSE": return "bg-gray-50 border border-gray-200 text-gray-600";
    default: return "bg-gray-50 border border-gray-200";
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "COURS": return "Cours";
    case "TPE": return "TPE";
    case "EVALUATION": return "Evaluation";
    case "PAUSE": return "Pause";
    default: return type;
  }
}

export default function PedagogiePage() {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeFiliereId, setActiveFiliereId] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<"emploi" | "examens">("emploi");

  // Add slot modal
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState(emptySlotForm);
  const [slotSubmitting, setSlotSubmitting] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [collisionWarning, setCollisionWarning] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [filieresRes, roomsRes, assignmentsRes, schedulesRes] = await Promise.all([
        fetch("/api/filieres"),
        fetch("/api/rooms"),
        fetch("/api/course-assignments?academicYear=2025-2026"),
        fetch("/api/schedules?academicYear=2025-2026"),
      ]);
      const filieresData: Filiere[] = filieresRes.ok ? await filieresRes.json() : [];
      const roomsData: Room[] = roomsRes.ok ? await roomsRes.json() : [];
      const assignmentsData: CourseAssignment[] = assignmentsRes.ok ? await assignmentsRes.json() : [];
      const schedulesData: Schedule[] = schedulesRes.ok ? await schedulesRes.json() : [];

      setFilieres(filieresData);
      setRooms(roomsData);
      setAssignments(assignmentsData);
      setSchedules(schedulesData);
      if (filieresData.length > 0 && !activeFiliereId) {
        setActiveFiliereId(filieresData[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [activeFiliereId]);

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Collision detection: same room, same day, same startTime
  const collisions = new Set<string>();
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i];
      const b = schedules[j];
      if (a.dayOfWeek === b.dayOfWeek && a.roomId && a.roomId === b.roomId && a.startTime === b.startTime) {
        collisions.add(a.id);
        collisions.add(b.id);
      }
    }
  }

  const filiere = filieres.find((f) => f.id === activeFiliereId);
  const filiereSchedules = schedules.filter((s) => s.filiereId === activeFiliereId);
  const coursSchedules = filiereSchedules.filter((s) => s.type !== "EVALUATION");
  const examSchedules = filiereSchedules.filter((s) => s.type === "EVALUATION");

  const filiereAssignments = assignments.filter((a) => a.course.filiereId === activeFiliereId);

  const totalCollisions = collisions.size / 2;

  async function handleDeleteSlot(id: string) {
    if (!confirm("Supprimer ce creneau ?")) return;
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Erreur lors de la suppression.");
      return;
    }
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSlotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSlotSubmitting(true);
    setSlotError("");
    setCollisionWarning(false);
    try {
      const payload: Record<string, unknown> = {
        filiereId: activeFiliereId,
        dayOfWeek: slotForm.dayOfWeek,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        type: slotForm.type,
        academicYear: "2025-2026",
        semester: 1,
        roomId: slotForm.roomId || undefined,
        courseAssignmentId: slotForm.courseAssignmentId || undefined,
        sessionNumber: slotForm.sessionNumber ? parseInt(slotForm.sessionNumber) : undefined,
      };
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.collision) {
          setCollisionWarning(true);
          setSlotError(data.error);
        } else {
          setSlotError(data.error ?? "Erreur.");
        }
        return;
      }
      setShowSlotModal(false);
      setSlotForm(emptySlotForm);
      // Reload schedules
      const schedulesRes = await fetch("/api/schedules?academicYear=2025-2026");
      if (schedulesRes.ok) setSchedules(await schedulesRes.json());
    } finally {
      setSlotSubmitting(false);
    }
  }

  function openSlotModal() {
    setSlotForm(emptySlotForm);
    setSlotError("");
    setCollisionWarning(false);
    setShowSlotModal(true);
  }

  function renderTimetableGrid(slotsList: Schedule[]) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 p-3 text-left text-gray-600 w-28">Horaire</th>
              {DAYS.map((d) => (
                <th key={d} className="border border-gray-200 p-3 text-center text-gray-600 min-w-32">{DAY_LABELS[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-orange-50/50">
              <td colSpan={7} className="border border-gray-200 p-1.5 text-center text-xs font-medium text-orange-600">
                Pause : 12h00 a 13h00
              </td>
            </tr>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot.start}>
                <td className="border border-gray-200 p-2 bg-gray-50 text-xs text-gray-500 font-medium whitespace-nowrap">
                  {slot.label}
                </td>
                {DAYS.map((day) => {
                  const matchingSlots = slotsList.filter(
                    (s) => s.dayOfWeek === day && s.startTime === slot.start
                  );
                  return (
                    <td key={day} className="border border-gray-200 p-1.5 align-top min-h-16">
                      {matchingSlots.map((s) => {
                        const hasCollision = collisions.has(s.id);
                        return (
                          <div
                            key={s.id}
                            className={`rounded-lg p-2 text-xs mb-1 relative group ${hasCollision ? "bg-red-50 border border-red-300" : getSlotStyle(s.type)}`}
                          >
                            {hasCollision && (
                              <div className="flex items-center gap-1 text-red-600 font-bold mb-1 text-xs">
                                <AlertTriangle className="w-3 h-3" />Collision
                              </div>
                            )}
                            <div className="font-semibold leading-tight">
                              {s.courseAssignment ? s.courseAssignment.course.name : getTypeLabel(s.type)}
                            </div>
                            {s.courseAssignment && (
                              <div className="text-gray-500 mt-0.5">{s.courseAssignment.teacher.lastName}</div>
                            )}
                            {s.room && (
                              <div className="text-gray-500 mt-0.5">{s.room.code}</div>
                            )}
                            {s.sessionNumber && (
                              <div className="text-gray-400">Session {s.sessionNumber}</div>
                            )}
                            <button
                              onClick={() => handleDeleteSlot(s.id)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
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
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SI-Pedagogie</h1>
          <p className="text-gray-500 text-sm">Emploi du temps 2025-2026, Semestre 1</p>
        </div>
        {totalCollisions > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">{totalCollisions} collision(s) detectee(s)</span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{schedules.length}</p>
          <p className="text-xs text-gray-500 mt-1">Creneaux planifies</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-[#B91C2F]">{totalCollisions}</p>
          <p className="text-xs text-gray-500 mt-1">Collisions</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{rooms.length}</p>
          <p className="text-xs text-gray-500 mt-1">Salles disponibles</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{filieres.length}</p>
          <p className="text-xs text-gray-500 mt-1">Filieres</p>
        </CardContent></Card>
      </div>

      {/* Filiere tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
        {filieres.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFiliereId(f.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFiliereId === f.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >
            {f.code} - {f.name}
          </button>
        ))}
      </div>

      {filiere && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveSubTab("emploi")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSubTab === "emploi" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
              >
                Emploi du temps des cours
              </button>
              <button
                onClick={() => setActiveSubTab("examens")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSubTab === "examens" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
              >
                Planning des examens SN
              </button>
            </div>
            <Button size="sm" className="bg-[#B91C2F] hover:bg-[#9b1727] text-white" onClick={openSlotModal}>
              <Plus className="w-4 h-4 mr-1" />Ajouter un creneau
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-800">{filiere.name}</span>
                {activeSubTab === "emploi" ? (
                  <Badge className="bg-blue-100 text-blue-800">{coursSchedules.length} creneaux</Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800">{examSchedules.length} evaluations</Badge>
                )}
              </div>
              <div className="p-4">
                {activeSubTab === "emploi" ? renderTimetableGrid(coursSchedules) : renderTimetableGrid(examSchedules)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {filieres.length === 0 && (
        <div className="text-center py-16 text-gray-400">Aucune filiere configuree.</div>
      )}

      {/* Add Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSlotModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Ajouter un creneau</h2>
            {filiere && <p className="text-sm text-gray-500 mb-5">Filiere: {filiere.name}</p>}
            <form onSubmit={handleSlotSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sl-type">Type</Label>
                  <Select id="sl-type" value={slotForm.type} onChange={(e) => setSlotForm((f) => ({ ...f, type: e.target.value as typeof slotForm.type }))}>
                    <option value="COURS">Cours</option>
                    <option value="TPE">TPE</option>
                    <option value="EVALUATION">Evaluation</option>
                    <option value="PAUSE">Pause</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sl-day">Jour</Label>
                  <Select id="sl-day" value={slotForm.dayOfWeek} onChange={(e) => setSlotForm((f) => ({ ...f, dayOfWeek: e.target.value }))}>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{DAY_LABELS[d]}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sl-start">Heure de debut</Label>
                  <Input id="sl-start" type="time" value={slotForm.startTime} onChange={(e) => setSlotForm((f) => ({ ...f, startTime: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="sl-end">Heure de fin</Label>
                  <Input id="sl-end" type="time" value={slotForm.endTime} onChange={(e) => setSlotForm((f) => ({ ...f, endTime: e.target.value }))} required />
                </div>
              </div>
              <div>
                <Label htmlFor="sl-room">Salle</Label>
                <Select id="sl-room" value={slotForm.roomId} onChange={(e) => setSlotForm((f) => ({ ...f, roomId: e.target.value }))}>
                  <option value="">Aucune salle</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                  ))}
                </Select>
              </div>
              {slotForm.type === "COURS" && (
                <div>
                  <Label htmlFor="sl-assignment">Cours assigne</Label>
                  <Select id="sl-assignment" value={slotForm.courseAssignmentId} onChange={(e) => setSlotForm((f) => ({ ...f, courseAssignmentId: e.target.value }))}>
                    <option value="">Selectionner un cours</option>
                    {filiereAssignments.map((a) => (
                      <option key={a.id} value={a.id}>{a.course.name} - {a.teacher.lastName}</option>
                    ))}
                  </Select>
                </div>
              )}
              {slotForm.type === "EVALUATION" && (
                <div>
                  <Label htmlFor="sl-session">Numero de session</Label>
                  <Input id="sl-session" type="number" min={1} value={slotForm.sessionNumber} onChange={(e) => setSlotForm((f) => ({ ...f, sessionNumber: e.target.value }))} placeholder="1" />
                </div>
              )}
              {collisionWarning && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{slotError}</p>
                </div>
              )}
              {slotError && !collisionWarning && <p className="text-sm text-red-600">{slotError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowSlotModal(false)}>Annuler</Button>
                <Button type="submit" className="flex-1 bg-[#B91C2F] hover:bg-[#9b1727] text-white" disabled={slotSubmitting}>
                  {slotSubmitting ? "Enregistrement..." : "Ajouter"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
