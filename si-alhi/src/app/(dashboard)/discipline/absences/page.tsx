"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, AlertTriangle, CheckCircle, ClipboardList } from "lucide-react";

interface ScheduleOption {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: string;
  label?: string | null;
  courseAssignment?: {
    course: { code: string; name: string };
    teacher: { firstName: string; lastName: string };
  } | null;
}

const DAY_MAP: Record<number, string> = { 1: "LUNDI", 2: "MARDI", 3: "MERCREDI", 4: "JEUDI", 5: "VENDREDI", 6: "SAMEDI" };

function getDayOfWeek(dateStr: string): string {
  return DAY_MAP[new Date(dateStr + "T00:00:00").getDay()] ?? "";
}

interface Student {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  filiere: { name: string };
  filiereId: string;
}

type AttendanceStatus = "PRESENT" | "ABSENT" | "RETARD" | "EXCUSE";

const statusOptions: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "PRESENT", label: "Présent", color: "bg-green-100 text-green-700 border-green-300" },
  { value: "ABSENT", label: "Absent", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "RETARD", label: "Retard", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "EXCUSE", label: "Excusé", color: "bg-blue-100 text-blue-700 border-blue-300" },
];

export default function AbsenceSaisiePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filieres, setFilieres] = useState<{ id: string; name: string }[]>([]);
  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendances, setAttendances] = useState<Record<string, AttendanceStatus>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filiereSchedules, setFiliereSchedules] = useState<ScheduleOption[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data: Student[]) => {
        if (!Array.isArray(data)) return;
        setStudents(data);
        const fMap = new Map<string, { id: string; name: string }>();
        data.forEach((s) => fMap.set(s.filiereId, { id: s.filiereId, name: s.filiere.name }));
        setFilieres(Array.from(fMap.values()));
        if (fMap.size > 0) setSelectedFiliere(fMap.values().next().value?.id ?? "");
        // Default all to PRESENT
        const defaults: Record<string, AttendanceStatus> = {};
        data.forEach((s) => { defaults[s.id] = "PRESENT"; });
        setAttendances(defaults);
      })
      .catch(() => setError("Erreur de chargement des étudiants"));
  }, []);

  useEffect(() => {
    if (!selectedFiliere) { setFiliereSchedules([]); setSelectedScheduleId(""); return; }
    fetch(`/api/schedules?filiereId=${selectedFiliere}&academicYear=2025-2026`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: ScheduleOption[]) => setFiliereSchedules(data));
    setSelectedScheduleId("");
  }, [selectedFiliere]);

  useEffect(() => {
    setSelectedScheduleId("");
  }, [date]);

  const currentDay = getDayOfWeek(date);
  const daySchedules = filiereSchedules.filter((s) => s.dayOfWeek === currentDay && s.type !== "PAUSE" && s.type !== "FERIER");

  const filtered = selectedFiliere ? students.filter((s) => s.filiereId === selectedFiliere) : students;

  function setStatus(studentId: string, status: AttendanceStatus) {
    setAttendances((prev) => ({ ...prev, [studentId]: status }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const entries = filtered.map((s) => ({
        studentId: s.id,
        date,
        status: attendances[s.id] ?? "PRESENT",
        justification: justifications[s.id] || null,
      }));

      const res = await fetch("/api/discipline/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries, scheduleId: selectedScheduleId || undefined }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setSaved(true);
    } catch {
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  const absentCount = filtered.filter((s) => attendances[s.id] === "ABSENT").length;
  const lateCount = filtered.filter((s) => attendances[s.id] === "RETARD").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/discipline">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Retour</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Saisie des absences</h1>
          <p className="text-sm text-gray-500">Émargement journalier par filière</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || filtered.length === 0}
          className="bg-[#B91C2F] text-white hover:bg-[#B91C2F]/90"
        >
          <Save className="w-4 h-4 mr-2" />{saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" />Émargements enregistrés avec succès.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Filière</label>
              <select
                value={selectedFiliere}
                onChange={(e) => setSelectedFiliere(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 bg-white min-w-40"
              >
                <option value="">Toutes les filières</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            {daySchedules.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Cours / Seance</label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 bg-white min-w-48"
                >
                  <option value="">Toutes les seances</option>
                  {daySchedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.courseAssignment
                        ? `${s.courseAssignment.course.code} - ${s.courseAssignment.course.name} (${s.startTime})`
                        : `${s.label ?? s.type} (${s.startTime})`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-3 text-sm ml-auto">
              <span className="text-red-600 font-semibold">{absentCount} absent{absentCount !== 1 ? "s" : ""}</span>
              <span className="text-amber-600 font-semibold">{lateCount} retard{lateCount !== 1 ? "s" : ""}</span>
              <span className="text-gray-500">{filtered.length} étudiants</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#B91C2F]" />
            Feuille d&apos;émargement du {new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              Aucun étudiant à afficher.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((student, idx) => {
                const status = attendances[student.id] ?? "PRESENT";
                const statusInfo = statusOptions.find((s) => s.value === status);
                return (
                  <div key={student.id} className={`flex items-center gap-4 px-4 py-3 ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                    <span className="text-sm text-gray-400 w-6 text-center font-mono">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-[#B91C2F]/10 flex items-center justify-center text-xs font-bold text-[#B91C2F]">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">{student.lastName} {student.firstName}</p>
                      <p className="text-xs text-gray-400 font-mono">{student.matricule}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {statusOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setStatus(student.id, opt.value)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                            status === opt.value
                              ? opt.color + " shadow-sm"
                              : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {(status === "ABSENT" || status === "RETARD") && (
                      <input
                        placeholder="Motif (optionnel)"
                        value={justifications[student.id] ?? ""}
                        onChange={(e) => setJustifications((prev) => ({ ...prev, [student.id]: e.target.value }))}
                        className="border rounded px-2 py-1 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-[#B91C2F]/30"
                      />
                    )}
                    <Badge className={statusInfo?.color ?? "bg-gray-100 text-gray-500"}>
                      {statusInfo?.label ?? status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
