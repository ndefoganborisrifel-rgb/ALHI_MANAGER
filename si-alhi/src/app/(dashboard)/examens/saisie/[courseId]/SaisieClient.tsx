"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, CheckCircle, AlertTriangle, BookOpen, Loader2, Eye } from "lucide-react";

interface CourseInfo {
  id: string;
  code: string;
  name: string;
  credits: number;
  totalHours: number | null;
  semester: number;
  filiere: { id: string; name: string };
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
  normaleValidated: boolean; // true si la note finale de session normale >= 14
}

function calcFinal(cc1: number | string, cc2: number | string, exam: number | string): number | null {
  const c1 = cc1 !== "" ? Number(cc1) : null;
  const c2 = cc2 !== "" ? Number(cc2) : null;
  const ex = exam !== "" ? Number(exam) : null;
  if (ex === null) return null;
  if (c1 !== null && c2 !== null) return c1 * 0.25 + c2 * 0.25 + ex * 0.5;
  if (c1 !== null) return c1 * 0.5 + ex * 0.5;
  return ex;
}

// Seuil de validation ALHI
const PASSING_GRADE = 14;

export function SaisieClient({ courseId, canEdit }: { courseId: string; canEdit: boolean }) {
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedAll, setSavedAll] = useState(false);
  const [academicYear] = useState("2025-2026");
  const [session, setSession] = useState<"NORMALE" | "RATTRAPAGE">("NORMALE");

  useEffect(() => {
    const init = async () => {
      try {
        const courseRes = await fetch(`/api/courses/${courseId}`);
        if (!courseRes.ok) {
          setError("Cours introuvable");
          setLoading(false);
          return;
        }
        const courseData: CourseInfo = await courseRes.json();
        setCourse(courseData);

        const [studentsRes, gradesRes] = await Promise.all([
          fetch(`/api/students?filiereId=${courseData.filiere.id}`).then((r) => r.json()),
          fetch(`/api/grades?courseId=${courseId}`).then((r) => r.json()),
        ]);

        const students: Array<{ id: string; matricule: string; firstName: string; lastName: string }> =
          Array.isArray(studentsRes) ? studentsRes : [];

        const grades: Array<{ id: string; studentId: string; cc1: number | null; cc2: number | null; examScore: number | null; noteFinal: number | null; session: string }> =
          Array.isArray(gradesRes) ? gradesRes : [];

        const normaleGrades = grades.filter((g) => g.session === "NORMALE");
        const sessionGrades = grades.filter((g) => g.session === session);
        const normaleMap = new Map(normaleGrades.map((g) => [g.studentId, g]));
        const gradeMap = new Map(sessionGrades.map((g) => [g.studentId, g]));

        const allRows: StudentRow[] = students.map((s) => {
          const existing = gradeMap.get(s.id);
          const normale = normaleMap.get(s.id);
          // En session rattrapage, les CC viennent de la session normale (read-only)
          const cc1Val = session === "RATTRAPAGE" ? (normale?.cc1 ?? "") : (existing?.cc1 ?? "");
          const cc2Val = session === "RATTRAPAGE" ? (normale?.cc2 ?? "") : (existing?.cc2 ?? "");
          const normaleNoteFinal = normale?.noteFinal ?? null;
          const normaleValidated = normaleNoteFinal != null && normaleNoteFinal >= PASSING_GRADE;
          return {
            id: s.id,
            matricule: s.matricule,
            firstName: s.firstName,
            lastName: s.lastName,
            cc1: cc1Val,
            cc2: cc2Val,
            examScore: existing?.examScore ?? "",
            noteFinal: existing?.noteFinal ?? null,
            gradeId: existing?.id ?? null,
            saved: !!existing,
            normaleValidated,
          };
        });

        setRows(allRows);
      } catch {
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [courseId, session]);

  function updateRow(idx: number, field: "cc1" | "cc2" | "examScore", value: string) {
    if (value !== "") {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 20) return;
    }
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
    if (!canEdit) return;
    const row = rows[idx];
    if (session === "RATTRAPAGE" && row.normaleValidated) return;
    setSaving((prev) => ({ ...prev, [row.id]: true }));
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: row.id,
          courseId,
          cc1: row.cc1 !== "" ? Number(row.cc1) : null,
          cc2: row.cc2 !== "" ? Number(row.cc2) : null,
          examScore: row.examScore !== "" ? Number(row.examScore) : null,
          session,
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
      } else {
        setError(data.error);
      }
    } finally {
      setSaving((prev) => ({ ...prev, [row.id]: false }));
    }
  }

  async function saveAll() {
    if (!canEdit) return;
    setSavedAll(false);
    for (let i = 0; i < rows.length; i++) {
      await saveRow(i);
    }
    setSavedAll(true);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#B91C2F]" />
        <p>Chargement du cours...</p>
      </div>
    );
  }

  if (error && !course) {
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
            <h1 className="text-xl font-bold text-gray-900">{course ? course.name : "Chargement..."}</h1>
            {!canEdit && (
              <Badge className="bg-gray-100 text-gray-600 flex items-center gap-1"><Eye className="w-3 h-3" />Lecture seule</Badge>
            )}
          </div>
          {course && (
            <p className="text-sm text-gray-500">
              {course.filiere.name}, Semestre {course.semester}, {course.credits} crédit{course.credits > 1 ? "s" : ""}
              {course.ue ? `, UE: ${course.ue.code}` : ""}
            </p>
          )}
        </div>
        {canEdit && (
          <Button
            onClick={saveAll}
            className="bg-[#B91C2F] text-white hover:bg-[#B91C2F]/90"
            disabled={rows.length === 0 || Object.values(saving).some(Boolean)}
          >
            <Save className="w-4 h-4 mr-2" />Tout sauvegarder
          </Button>
        )}
      </div>

      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-amber-800 text-sm">
          <Eye className="w-4 h-4 shrink-0" />
          Vous consultez les notes de cette matière en lecture seule. Seul l&apos;enseignant assigné à cette matière peut les modifier.
        </div>
      )}

      {savedAll && canEdit && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" />Notes sauvegardées avec succès.
        </div>
      )}

      {/* Session toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span className="text-sm font-semibold text-gray-600">Session :</span>
        {(["NORMALE", "RATTRAPAGE"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSession(s)}
            style={{
              padding: "6px 18px",
              borderRadius: "8px",
              border: "1.5px solid",
              borderColor: session === s ? "#B91C2F" : "#e5e7eb",
              background: session === s ? "#B91C2F" : "white",
              color: session === s ? "white" : "#374151",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {s === "NORMALE" ? "Normale" : "Rattrapage"}
          </button>
        ))}
        {session === "RATTRAPAGE" && (
          <span style={{ fontSize: "12px", color: "#d97706", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "6px", padding: "3px 10px" }}>
            Seule la note d&apos;examen de rattrapage est saisie
          </span>
        )}
      </div>

      {/* Formule */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="p-4 text-sm text-blue-800">
          {session === "NORMALE" ? (
            <>
              <strong>Formule :</strong> Note finale = Moyenne(CC) x 50% + Examen x 50%.
              Avec 2 CC : (CC1 + CC2) / 2, puis x 50%. Avec un seul CC : CC x 50% + Examen x 50%. Sans CC : note examen seule.
              <span className="ml-2 font-bold text-[#B91C2F]">Seuil de validation : 14/20.</span>
              Si la note est inférieure à 14, l&apos;étudiant passe en rattrapage (examen uniquement).
            </>
          ) : (
            <>
              <strong>Session de rattrapage :</strong> La note de l&apos;examen de rattrapage remplace la note d&apos;examen.
              Les CC de la session normale sont conservés (affichés en lecture seule).
              <span className="block mt-1">Formule : Moyenne(CC) x 50% + Exam.Ratt. x 50%, soit (CC1 + CC2) / 2 x 50%.</span>
              <span className="font-bold text-[#B91C2F]">Seuil de validation : 14/20.</span>
            </>
          )}
        </CardContent>
      </Card>

      {/* Grade table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#B91C2F]" />
            Notes ({rows.length} étudiant{rows.length !== 1 ? "s" : ""})
          </CardTitle>
          <span className="text-sm text-gray-500">{academicYear}</span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Aucun étudiant inscrit dans cette filière.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 w-36">Matricule</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Étudiant</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 w-24">
                    CC1/20{session === "RATTRAPAGE" && <span className="block text-xs font-normal text-amber-600">(conserve)</span>}
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 w-24">
                    CC2/20{session === "RATTRAPAGE" && <span className="block text-xs font-normal text-amber-600">(conserve)</span>}
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 w-28">{session === "RATTRAPAGE" ? "Exam. Rattrapage/20" : "Examen/20"}</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 w-24">Note/20</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 w-28">Résultat (seuil 14)</th>
                  {canEdit && <th className="px-3 py-3 w-24" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const preview = calcFinal(row.cc1, row.cc2, row.examScore);
                  const passed = preview != null && preview >= PASSING_GRADE;
                  return (
                    <tr key={row.id} className={`border-b hover:bg-gray-50 ${row.saved ? "bg-green-50/30" : ""}`}>
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{row.matricule}</td>
                      <td className="px-4 py-2 font-medium text-gray-900">{row.lastName} {row.firstName}</td>
                      {/* CC1 */}
                      <td className="px-3 py-2">
                        {session === "RATTRAPAGE" ? (
                          <div className="text-center text-gray-500 bg-amber-50 rounded py-1 text-sm">
                            {row.cc1 !== "" ? row.cc1 : <span className="text-gray-300">-</span>}
                          </div>
                        ) : canEdit ? (
                          <input type="number" min="0" max="20" step="0.25" placeholder="0" value={row.cc1}
                            onChange={(e) => updateRow(idx, "cc1", e.target.value)}
                            className="w-full text-center border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]" />
                        ) : (
                          <div className="text-center text-gray-700">{row.cc1 !== "" ? row.cc1 : <span className="text-gray-300">-</span>}</div>
                        )}
                      </td>
                      {/* CC2 */}
                      <td className="px-3 py-2">
                        {session === "RATTRAPAGE" ? (
                          <div className="text-center text-gray-500 bg-amber-50 rounded py-1 text-sm">
                            {row.cc2 !== "" ? row.cc2 : <span className="text-gray-300">-</span>}
                          </div>
                        ) : canEdit ? (
                          <input type="number" min="0" max="20" step="0.25" placeholder="0" value={row.cc2}
                            onChange={(e) => updateRow(idx, "cc2", e.target.value)}
                            className="w-full text-center border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]" />
                        ) : (
                          <div className="text-center text-gray-700">{row.cc2 !== "" ? row.cc2 : <span className="text-gray-300">-</span>}</div>
                        )}
                      </td>
                      {/* Examen */}
                      <td className="px-3 py-2">
                        {session === "RATTRAPAGE" && row.normaleValidated ? (
                          <div className="text-center">
                            <Badge className="bg-green-100 text-green-700 text-xs">Déjà validé</Badge>
                          </div>
                        ) : canEdit ? (
                          <input type="number" min="0" max="20" step="0.25" placeholder="0" value={row.examScore}
                            onChange={(e) => updateRow(idx, "examScore", e.target.value)}
                            className="w-full text-center border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]" />
                        ) : (
                          <div className="text-center text-gray-700">{row.examScore !== "" ? row.examScore : <span className="text-gray-300">-</span>}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {preview != null ? (
                          <span className={`font-bold ${passed ? "text-green-600" : preview >= 10 ? "text-amber-600" : "text-red-600"}`}>{preview.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {session === "RATTRAPAGE" && row.normaleValidated ? (
                          <Badge className="bg-green-100 text-green-700">Validé (S.N.)</Badge>
                        ) : preview != null ? (
                          <Badge className={passed ? "bg-green-100 text-green-700" : preview >= 10 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                            {passed ? "Validé" : preview >= 10 ? "Rattrapage" : "Ajourné"}
                          </Badge>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2">
                          <Button
                            size="sm"
                            variant={row.saved ? "outline" : "default"}
                            disabled={saving[row.id]}
                            onClick={() => saveRow(idx)}
                            className={row.saved ? "text-green-600 border-green-200 bg-green-50" : "bg-[#B91C2F] text-white hover:bg-[#B91C2F]/90"}
                          >
                            {saving[row.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : row.saved ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                      )}
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
