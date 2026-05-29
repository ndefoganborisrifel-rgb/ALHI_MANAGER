import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, FileText, Award, ClipboardList, ArrowRight, GraduationCap } from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui/PageUI";
import { calculateGeneralAverage, getMention } from "@/lib/grade-calculator";

export default async function ExamensPage() {
  const session = await auth();
  const role = session?.user.role ?? "ETUDIANT";
  const userId = session?.user.id;

  const [filieres, totalGrades, students] = await Promise.all([
    prisma.filiere.findMany({ orderBy: { name: "asc" } }),
    prisma.grade.count({ where: { academicYear: "2025-2026" } }),
    prisma.student.count({ where: { status: { in: ["ACTIF", "INSCRIT"] } } }),
  ]);

  const canEnterGrades = ["ADMIN", "SCOLARITE", "ENSEIGNANT"].includes(role);
  const canManage = ["ADMIN", "SCOLARITE"].includes(role);

  type DelibResult = { average: number | null; mention: string; decision: string; credits: number };

  type CourseGradeRow = {
    courseId: string;
    courseName: string;
    courseCode: string;
    semester: number;
    credits: number;
    session: string;
    cc1: number | null;
    cc2: number | null;
    examScore: number | null;
    noteFinal: number | null;
    pvNormalePublished: boolean;
    pvRattrapagePublished: boolean;
  };

  // For students: find their own student record to link to their bulletin + PV
  let myStudent: { id: string; filiereId: string; bulletinsPublished: boolean } | null = null;
  let myDelib: DelibResult | null = null;
  let myCourseGrades: CourseGradeRow[] = [];
  if (role === "ETUDIANT" && userId) {
    const s = await prisma.student.findFirst({
      where: { userId },
      select: {
        id: true, filiereId: true,
        filiere: { select: { bulletinsPublished: true, pvPublished: true } },
        grades: {
          where: { academicYear: "2025-2026" },
          include: {
            course: {
              select: { credits: true, name: true, code: true, semester: true, pvNormalePublished: true, pvRattrapagePublished: true },
            },
          },
        },
      },
    });
    if (s) {
      myStudent = { id: s.id, filiereId: s.filiereId, bulletinsPublished: s.filiere.bulletinsPublished };
      const sem1Grades = s.grades.filter((g) => g.semester === 1);
      if (s.filiere.pvPublished && sem1Grades.length > 0) {
        const gradeData = sem1Grades.map((g) => ({ average: g.noteFinal, credits: g.course.credits }));
        const avg = calculateGeneralAverage(gradeData);
        const credits = sem1Grades.filter((g) => (g.noteFinal ?? 0) >= 10).reduce((sum, g) => sum + g.course.credits, 0);
        myDelib = { average: avg, mention: getMention(avg), decision: avg !== null && avg >= 10 ? "Admis" : "Ajourné", credits };
      }
      // Per-course grades visible when course PV is published
      myCourseGrades = s.grades
        .filter((g) =>
          (g.session === "NORMALE" && g.course.pvNormalePublished) ||
          (g.session === "RATTRAPAGE" && g.course.pvRattrapagePublished)
        )
        .map((g) => ({
          courseId: g.courseId,
          courseName: g.course.name,
          courseCode: g.course.code,
          semester: g.course.semester,
          credits: g.course.credits,
          session: g.session,
          cc1: g.cc1,
          cc2: g.cc2,
          examScore: g.examScore,
          noteFinal: g.noteFinal,
          pvNormalePublished: g.course.pvNormalePublished,
          pvRattrapagePublished: g.course.pvRattrapagePublished,
        }));
    }
  }

  // For parents: list their children with bulletin links + PV
  type ChildResult = { id: string; firstName: string; lastName: string; bulletinsPublished: boolean; delib: DelibResult | null };
  let myChildren: ChildResult[] = [];
  if (role === "PARENT" && userId) {
    const parent = await prisma.parent.findFirst({
      where: { userId },
      include: {
        students: {
          include: {
            filiere: { select: { bulletinsPublished: true, pvPublished: true } },
            grades: { where: { academicYear: "2025-2026", semester: 1 }, include: { course: { select: { credits: true } } } },
          },
        },
      },
    });
    if (parent) {
      myChildren = parent.students.map((c) => {
        let delib: DelibResult | null = null;
        if (c.filiere.pvPublished && c.grades.length > 0) {
          const gradeData = c.grades.map((g) => ({ average: g.noteFinal, credits: g.course.credits }));
          const avg = calculateGeneralAverage(gradeData);
          const credits = c.grades.filter((g) => (g.noteFinal ?? 0) >= 10).reduce((sum, g) => sum + g.course.credits, 0);
          delib = { average: avg, mention: getMention(avg), decision: avg !== null && avg >= 10 ? "Admis" : "Ajourné", credits };
        }
        return { id: c.id, firstName: c.firstName, lastName: c.lastName, bulletinsPublished: c.filiere.bulletinsPublished, delib };
      });
    }
  }

  const actions = [
    ...(canEnterGrades ? [{ label: "Saisir les notes CC1, CC2, Examen", href: "/examens/saisie", icon: BookOpen, desc: "Remplir les notes des etudiants par cours" }] : []),
    ...(canManage ? [{ label: "Consulter et publier les bulletins", href: "/examens/bulletins", icon: FileText, desc: "Bulletins semestriels par etudiant" }] : []),
    ...(canEnterGrades ? [
      { label: "PV de notes par cours", href: "/examens/pv", icon: ClipboardList, desc: "Publiez les PV par matiere et par session" },
    ] : []),
    ...(canManage ? [{ label: "PV de deliberation", href: "/examens/deliberation", icon: Award, desc: "Deliberation et decisions du jury" }] : []),
  ];

  return (
    <div style={{ maxWidth: "1100px" }}>
      <PageHeader
        title="SI-Examens et Notes"
        subtitle="Saisie des notes et generation des bulletins, 2025-2026."
        backHref="/dashboard"
        icon={<BookOpen style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
        actions={canEnterGrades ? (
          <>
            <Link href="/examens/saisie" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "var(--bg-card)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: "10px", fontWeight: 600, fontSize: "13px", textDecoration: "none" }}>
              <BookOpen style={{ width: "14px", height: "14px" }} />Saisir les notes
            </Link>
            {canManage && (
              <Link href="/examens/bulletins" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "#B91C2F", color: "white", borderRadius: "10px", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>
                <FileText style={{ width: "14px", height: "14px" }} />Bulletins
              </Link>
            )}
          </>
        ) : undefined}
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "18px" }}>
        <StatCard label="Notes saisies" value={totalGrades.toLocaleString("fr-FR")} icon={<BookOpen style={{ width: "18px", height: "18px", color: "#2563eb" }} />} color="#2563eb" bg="#eff6ff" sub="annee 2025-2026" />
        <StatCard label="Etudiants actifs" value={students.toLocaleString("fr-FR")} icon={<GraduationCap style={{ width: "18px", height: "18px", color: "#16a34a" }} />} color="#16a34a" bg="#f0fdf4" sub="inscrits" />
        <StatCard label="Filieres" value={filieres.length} icon={<Award style={{ width: "18px", height: "18px", color: "#B91C2F" }} />} color="#B91C2F" bg="#fef2f2" sub="filières" />
      </div>

      {/* Student bulletin card */}
      {role === "ETUDIANT" && myStudent && (
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", padding: "20px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: myStudent.bulletinsPublished ? "#16a34a20" : "#9ca3af20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText style={{ width: "26px", height: "26px", color: myStudent.bulletinsPublished ? "#16a34a" : "#9ca3af" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: "700", fontSize: "15px", color: "var(--text)", marginBottom: "3px" }}>Mon bulletin de notes</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {myStudent.bulletinsPublished
                ? "Bulletin disponible, cliquez pour consulter ou imprimer."
                : "Le bulletin n'est pas encore publie par la direction."}
            </p>
          </div>
          {myStudent.bulletinsPublished ? (
            <Link href={`/print/bulletin/${myStudent.id}?semester=1&year=2025-2026`} target="_blank" style={{ padding: "8px 16px", background: "#B91C2F", color: "white", borderRadius: "9px", fontWeight: "700", fontSize: "12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <FileText style={{ width: "13px", height: "13px" }} />Voir mon bulletin
            </Link>
          ) : (
            <span style={{ padding: "8px 16px", background: "var(--bg-muted)", color: "var(--text-muted)", borderRadius: "9px", fontWeight: "600", fontSize: "12px" }}>
              Non publie
            </span>
          )}
        </div>
      )}

      {/* Student per-course grades */}
      {role === "ETUDIANT" && myCourseGrades.length > 0 && (
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
            <GraduationCap style={{ width: "15px", height: "15px", color: "#B91C2F" }} />
            <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Mes notes publiees par cours</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "var(--bg-muted)" }}>
                  {["Matiere", "Session", "CC1", "CC2", "Examen", "Note finale", "Resultat"].map((h) => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: "600", color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myCourseGrades.map((g, i) => {
                  const passed = (g.noteFinal ?? 0) >= 10;
                  return (
                    <tr key={`${g.courseId}-${g.session}`} style={{ borderTop: i > 0 ? "1px solid var(--border-muted)" : "none" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <p style={{ fontWeight: "600", color: "var(--text)", fontSize: "12px" }}>{g.courseName}</p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>{g.courseCode} - S{g.semester}</p>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "20px", background: g.session === "NORMALE" ? "#16a34a18" : "#7c3aed18", color: g.session === "NORMALE" ? "#16a34a" : "#7c3aed" }}>
                          {g.session === "NORMALE" ? "Normale" : "Rattrapage"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-secondary)", textAlign: "center" }}>{g.cc1 != null ? g.cc1.toFixed(1) : <span style={{ color: "var(--text-muted)" }}>-</span>}</td>
                      <td style={{ padding: "10px 14px", color: "var(--text-secondary)", textAlign: "center" }}>{g.cc2 != null ? g.cc2.toFixed(1) : <span style={{ color: "var(--text-muted)" }}>-</span>}</td>
                      <td style={{ padding: "10px 14px", color: "var(--text-secondary)", textAlign: "center" }}>{g.examScore != null ? g.examScore.toFixed(1) : <span style={{ color: "var(--text-muted)" }}>-</span>}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        {g.noteFinal != null ? (
                          <span style={{ fontWeight: "800", fontSize: "14px", color: passed ? "#16a34a" : "#B91C2F" }}>{g.noteFinal.toFixed(2)}</span>
                        ) : <span style={{ color: "var(--text-muted)" }}>-</span>}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ padding: "2px 9px", borderRadius: "20px", fontSize: "10px", fontWeight: "600", background: passed ? "#16a34a18" : "#B91C2F18", color: passed ? "#16a34a" : "#B91C2F" }}>
                          {passed ? "Valide" : "Ajourne"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student PV de deliberation */}
      {role === "ETUDIANT" && myDelib && (
        <div style={{ background: myDelib.decision === "Admis" ? "#f0fdf4" : "#fef2f2", borderRadius: "12px", border: `1px solid ${myDelib.decision === "Admis" ? "#86efac" : "#fca5a5"}`, padding: "20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <Award style={{ width: "20px", height: "20px", color: myDelib.decision === "Admis" ? "#16a34a" : "#dc2626" }} />
            <span style={{ fontWeight: "800", fontSize: "15px", color: myDelib.decision === "Admis" ? "#15803d" : "#991b1b" }}>
              Resultat de deliberation : {myDelib.decision}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            <div style={{ background: "white", borderRadius: "10px", padding: "12px 14px", textAlign: "center" }}>
              <p style={{ fontSize: "22px", fontWeight: "800", color: myDelib.average !== null && myDelib.average >= 10 ? "#16a34a" : "#dc2626" }}>
                {myDelib.average !== null ? myDelib.average.toFixed(2) : "N.C."}<span style={{ fontSize: "13px", fontWeight: "400", color: "#6b7280" }}>/20</span>
              </p>
              <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>Moyenne generale</p>
            </div>
            <div style={{ background: "white", borderRadius: "10px", padding: "12px 14px", textAlign: "center" }}>
              <p style={{ fontSize: "22px", fontWeight: "800", color: "#2563eb" }}>{myDelib.credits}</p>
              <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>Credits valides</p>
            </div>
            <div style={{ background: "white", borderRadius: "10px", padding: "12px 14px", textAlign: "center" }}>
              <p style={{ fontSize: "14px", fontWeight: "800", color: "#7c3aed" }}>{myDelib.mention}</p>
              <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>Mention</p>
            </div>
          </div>
        </div>
      )}

      {/* Parent : list children */}
      {role === "PARENT" && myChildren.length > 0 && (
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Bulletins et resultats de mes enfants</span>
          </div>
          <div style={{ padding: "6px" }}>
            {myChildren.map((c) => (
              <div key={c.id} style={{ borderRadius: "10px", marginBottom: "4px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <GraduationCap style={{ width: "18px", height: "18px", color: "#B91C2F" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>{c.firstName} {c.lastName}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {c.bulletinsPublished ? "Bulletin publie" : "Bulletin non encore publie"}
                      {c.delib ? ` • PV: ${c.delib.decision}` : ""}
                    </p>
                  </div>
                  {c.bulletinsPublished ? (
                    <Link href={`/print/bulletin/${c.id}?semester=1&year=2025-2026`} target="_blank" style={{ padding: "5px 12px", background: "#B91C2F", color: "white", borderRadius: "7px", fontSize: "11px", fontWeight: "600", textDecoration: "none" }}>
                      Voir bulletin
                    </Link>
                  ) : (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", padding: "5px 10px", background: "var(--bg-muted)", borderRadius: "7px" }}>
                      En attente
                    </span>
                  )}
                </div>
                {c.delib && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", padding: "0 12px 12px" }}>
                    <div style={{ background: c.delib.decision === "Admis" ? "#f0fdf4" : "#fef2f2", borderRadius: "8px", padding: "8px 10px", textAlign: "center" }}>
                      <p style={{ fontSize: "16px", fontWeight: "800", color: c.delib.decision === "Admis" ? "#16a34a" : "#dc2626" }}>
                        {c.delib.average !== null ? c.delib.average.toFixed(2) : "N.C."}<span style={{ fontSize: "10px" }}>/20</span>
                      </p>
                      <p style={{ fontSize: "10px", color: "#6b7280" }}>Moyenne</p>
                    </div>
                    <div style={{ background: "#eff6ff", borderRadius: "8px", padding: "8px 10px", textAlign: "center" }}>
                      <p style={{ fontSize: "16px", fontWeight: "800", color: "#2563eb" }}>{c.delib.credits}</p>
                      <p style={{ fontSize: "10px", color: "#6b7280" }}>Credits</p>
                    </div>
                    <div style={{ background: "#f5f3ff", borderRadius: "8px", padding: "8px 10px", textAlign: "center" }}>
                      <p style={{ fontSize: "12px", fontWeight: "700", color: "#7c3aed" }}>{c.delib.mention}</p>
                      <p style={{ fontSize: "10px", color: "#6b7280" }}>Mention</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: canManage ? "1fr 320px" : "1fr", gap: "16px" }}>
        {/* Actions */}
        {actions.length > 0 && (
          <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Actions disponibles</span>
            </div>
            <div style={{ padding: "6px" }}>
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href} style={{ textDecoration: "none", display: "block" }}>
                    <div className="card-hover" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px", marginBottom: "2px", cursor: "pointer" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon style={{ width: "18px", height: "18px", color: "#B91C2F" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)", marginBottom: "1px" }}>{action.label}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{action.desc}</p>
                      </div>
                      <ArrowRight style={{ width: "14px", height: "14px", color: "var(--text-muted)" }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Filieres (admin/scolarite only) */}
        {canManage && (
          <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Filieres</span>
            </div>
            <div style={{ padding: "8px" }}>
              {filieres.map((f, i) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "8px", background: "var(--bg-muted)", marginBottom: i < filieres.length - 1 ? "4px" : "0" }}>
                  <div>
                    <p style={{ fontWeight: "600", fontSize: "12px", color: "var(--text)", marginBottom: "1px" }}>{f.name}</p>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>{f.code}</p>
                  </div>
                  <Link href={`/examens/bulletins?filiere=${f.id}`} style={{ padding: "3px 10px", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "6px", fontSize: "11px", fontWeight: "600", color: "var(--text)", textDecoration: "none" }}>
                    Bulletins
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
