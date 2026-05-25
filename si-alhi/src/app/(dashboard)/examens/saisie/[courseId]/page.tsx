"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, CheckCircle, AlertTriangle, BookOpen } from "lucide-react";

interface CourseInfo {
  id: string;
  code: string;
  name: string;
  credits: number;
  totalHours: number;
  semester: number;
  filiere: { name: string; id: string };
  ue: { code: string; name: string } | null;
}

interface StudentRow {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  cc1: number | string;
  cc2: number | string;
  examScore: number | string;
  noteFinal: number | null;
  gradeId: string | null;
  saved: boolean;
}

function calcFinal(cc1: number | string, cc2: number | string, exam: number | string): number | null {
  const c1 = cc1 !== "" ? Number(cc1) : null;
  const c2 = cc2 !== "" ? Number(cc2) : null;
  const ex = exam !== "" ? Number(exam) : null;
  if (ex === null) return null;
  if (c1 !== null && c2 !== null) return c1 * 0.2 + c2 * 0.2 + ex * 0.6;
  if (c1 !== null) return c1 * 0.4 + ex * 0.6;
  return ex;
}

export default function SaisieNotesCoursePage() {
  const params = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedAll, setSavedAll] = useState(false);
  const [academicYear] = useState("2025-2026");

  const loadData = useCallback(async () => {
    try {
      const [courseRes, studentsRes, gradesRes] = await Promise.all([
        fetch(`/api/grades?courseId=${params.courseId}`).then((r) => r.json()),
        fetch("/api/students").then((r) => r.json()),
        fetch(`/api/grades?courseId=${params.courseId}`).then((r) => r.json()),
      ]);

      // Fetch course info from grades data or students API
      const cRes = await fetch(`/api/grades?courseId=${params.courseId}`);
      const gradeData = await cRes.json();

      // Get course info
      const courseInfoRes = await fetch(`/api/students`);
      const allStudents = await courseInfoRes.json();

      // We need to get course info separately
      const gradeCourseInfo = Array.isArray(gradeData) && gradeData.length > 0 ? gradeData[0].course : null;

      if (!gradeCourseInfo) {
        // Try to get from all courses
        const cInfoRes = await fetch(`/api/grades?courseId=${params.courseId}&limit=1`);
        const cInfo = await cInfoRes.json();
        void cInfo;
      }

      void courseRes;
      void studentsRes;
      void gradesRes;
    } catch {
      setError("Erreur de chargement");
    }
  }, [params.courseId]);

  useEffect(() => {
    const init = async () => {
      try {
        // Load grades (which include course and student info)
        const [gradesRes, studentsRes] = await Promise.all([
          fetch(`/api/grades?courseId=${params.courseId}`).then((r) => r.json()),
          fetch("/api/students").then((r) => r.json()),
        ]);

        const grades: Array<{
          id: string;
          studentId: string;
          courseId: string;
          cc1: number | null;
          cc2: number | null;
          examScore: number | null;
          noteFinal: number | null;
          course: CourseInfo;
          student: { id: string; matricule: string; firstName: string; lastName: string; filiereId: string };
        }> = Array.isArray(gradesRes) ? gradesRes : [];

        const courseData = grades[0]?.course ?? null;

        if (courseData) {
          setCourse(courseData);
          // Build rows from existing grades, then add students without grades
          const gradedStudentIds = new Set(grades.map((g) => g.studentId));
          const filiereStudents = Array.isArray(studentsRes)
            ? studentsRes.filter(
                (s: { filiereId: string }) => courseData && s.filiereId === courseData.filiere.id
              )
            : [];

          const gradeMap = new Map(grades.map((g) => [g.studentId, g]));

          const allRows: StudentRow[] = filiereStudents.map((s: { id: string; matricule: string; firstName: string; lastName: string }) => {
            const existing = gradeMap.get(s.id);
            return {
              id: s.id,
              matricule: s.matricule,
              firstName: s.firstName,
              lastName: s.lastName,
              cc1: existing?.cc1 ?? "",
              cc2: existing?.cc2 ?? "",
              examScore: existing?.examScore ?? "",
              noteFinal: existing?.noteFinal ?? null,
              gradeId: existing?.id ?? null,
              saved: !!existing,
            };
          });

          // Also add any graded students not in filiere list (shouldn't happen normally)
          grades.forEach((g) => {
            if (!gradedStudentIds.has(g.studentId) && !allRows.find((r) => r.id === g.studentId)) {
              allRows.push({
                id: g.student.id,
                matricule: g.student.matricule,
                firstName: g.student.firstName,
                lastName: g.student.lastName,
                cc1: g.cc1 ?? "",
                cc2: g.cc2 ?? "",
                examScore: g.examScore ?? "",
                noteFinal: g.noteFinal,
                gradeId: g.id,
                saved: true,
              });
            }
          });

          setRows(allRows.sort((a, b) => a.lastName.localeCompare(b.lastName)));
        } else {
          // No grades yet, just load students from all filières and show a message
          // Try to get course info from URL course id — minimal display
          setError(null);
          const allStud = Array.isArray(studentsRes) ? studentsRes : [];
          const studentRows: StudentRow[] = allStud.map((s: { id: string; matricule: string; firstName: string; lastName: string }) => ({
            id: s.id,
            matricule: s.matricule,
            firstName: s.firstName,
            lastName: s.lastName,
            cc1: "",
            cc2: "",
            examScore: "",
            noteFinal: null,
            gradeId: null,
            saved: false,
          }));
          setRows(studentRows.sort((a, b) => a.lastName.localeCompare(b.lastName)));
        }
      } catch {
        setError("Erreur lors du chargement des données");
      }
    };
    init();
  }, [params.courseId]);

  void loadData;

  function updateRow(idx: number, field: "cc1" | "cc2" | "examScore", value: string) {
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: value,
        noteFinal: calcFinal(
          field === "cc1" ? value : copy[idx].cc1,
          field === "cc2" ? value : copy[idx].cc2,
          field === "examScore" ? value : copy[idx].examScore,
        ),
        saved: false,
      };
      return copy;
    });
  }

  async function saveRow(idx: number) {
    const row = rows[idx];
    setSaving((prev) => ({ ...prev, [row.id]: true }));
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: row.id,
          courseId: params.courseId,
          cc1: row.cc1 !== "" ? Number(row.cc1) : null,
          cc2: row.cc2 !== "" ? Number(row.cc2) : null,
          examScore: row.examScore !== "" ? Number(row.examScore) : null,
          session: "NORMALE",
          academicYear,
          semester: course?.semester ?? 1,
        }),
      });
      const data = await res.json();
      if (!data.error) {
        setRows((prev) => {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], gradeId: data.id, noteFinal: data.noteFinal, saved: true };
          return copy;
        });
      }
    } finally {
      setSaving((prev) => ({ ...prev, [row.id]: false }));
    }
  }

  async function saveAll() {
    setSavedAll(false);
    for (let i = 0; i < rows.length; i++) {
      await saveRow(i);
    }
    setSavedAll(true);
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-gray-700">{error}</p>
        <Link href="/examens/saisie" className="mt-4">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/examens/saisie">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Retour</Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {course && (
              <span className="font-mono text-xs bg-[#B91C2F]/10 text-[#B91C2F] px-2 py-0.5 rounded">
                {course.code}
              </span>
            )}
            <h1 className="text-xl font-bold text-gray-900">
              {course ? course.name : "Chargement..."}
            </h1>
          </div>
          {course && (
            <p className="text-sm text-gray-500">
              {course.filiere.name}, Semestre {course.semester}, {course.credits} crédits
            </p>
          )}
        </div>
        <Button
          onClick={saveAll}
          className="bg-[#B91C2F] text-white hover:bg-[#B91C2F]/90"
          disabled={rows.length === 0 || Object.values(saving).some(Boolean)}
        >
          <Save className="w-4 h-4 mr-2" />Tout sauvegarder
        </Button>
      </div>

      {savedAll && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" />Notes sauvegardées avec succès.
        </div>
      )}

      {/* Info */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="p-4 text-sm text-blue-800">
          <strong>Formule de calcul :</strong> Note finale = CC1 x 20% + CC2 x 20% + Examen x 60%.
          Si CC2 absent : CC1 x 40% + Examen x 60%. Si CC absents : note examen seule.
        </CardContent>
      </Card>

      {/* Grade table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#B91C2F]" />
            Saisie des notes ({rows.length} étudiants)
          </CardTitle>
          <span className="text-sm text-gray-500">{academicYear}</span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Aucun étudiant trouvé pour cette filière.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 w-32">Matricule</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Étudiant</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 w-24">CC1/20</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 w-24">CC2/20</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 w-28">Examen/20</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 w-24">Note/20</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 w-28">Résultat</th>
                  <th className="px-3 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const preview = calcFinal(row.cc1, row.cc2, row.examScore);
                  const passed = preview != null && preview >= 10;
                  return (
                    <tr key={row.id} className={`border-b hover:bg-gray-50 ${row.saved ? "bg-green-50/30" : ""}`}>
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{row.matricule}</td>
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {row.lastName} {row.firstName}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.25"
                          placeholder="—"
                          value={row.cc1}
                          onChange={(e) => updateRow(idx, "cc1", e.target.value)}
                          className="w-full text-center border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.25"
                          placeholder="—"
                          value={row.cc2}
                          onChange={(e) => updateRow(idx, "cc2", e.target.value)}
                          className="w-full text-center border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.25"
                          placeholder="—"
                          value={row.examScore}
                          onChange={(e) => updateRow(idx, "examScore", e.target.value)}
                          className="w-full text-center border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        {preview != null ? (
                          <span className={`font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
                            {preview.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {preview != null ? (
                          <Badge className={passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {passed ? "Validé" : "Ajourné"}
                          </Badge>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          size="sm"
                          variant={row.saved ? "outline" : "default"}
                          disabled={saving[row.id]}
                          onClick={() => saveRow(idx)}
                          className={row.saved ? "text-green-600 border-green-200 bg-green-50" : "bg-[#B91C2F] text-white hover:bg-[#B91C2F]/90"}
                        >
                          {saving[row.id] ? "..." : row.saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
