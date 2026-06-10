import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookMarked, ArrowLeft, User, Lock } from "lucide-react";

type CourseRow = {
  id: string;
  code: string;
  name: string;
  credits: number;
  totalHours: number;
  semester: number;
  ueCode: string;
  ueName: string;
  teacher: { firstName: string; lastName: string; speciality?: string | null } | null;
};

async function getCoursesForFiliere(filiereId: string): Promise<CourseRow[]> {
  const courses = await prisma.course.findMany({
    where: { filiereId },
    include: {
      assignments: {
        where: { academicYear: "2025-2026" },
        include: { teacher: { select: { firstName: true, lastName: true, speciality: true } } },
        take: 1,
      },
    },
    orderBy: [{ semester: "asc" }, { code: "asc" }],
  });

  return courses.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    credits: c.credits,
    totalHours: c.totalHours,
    semester: c.semester,
    ueCode: c.ueCode,
    ueName: c.ueName,
    teacher: c.assignments[0]?.teacher ?? null,
  }));
}

function CourseTable({ courses }: { courses: CourseRow[] }) {
  const byHalf: Record<number, CourseRow[]> = {};
  for (const c of courses) {
    if (!byHalf[c.semester]) byHalf[c.semester] = [];
    byHalf[c.semester].push(c);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {Object.entries(byHalf)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([sem, list]) => (
          <div key={sem} style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px", background: "var(--bg-muted)" }}>
              <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text)" }}>Semestre {sem}</span>
              <span style={{ padding: "2px 8px", background: "#2563eb20", color: "#2563eb", borderRadius: "20px", fontSize: "11px", fontWeight: 600 }}>
                {list.length} matière{list.length > 1 ? "s" : ""}
              </span>
              <span style={{ padding: "2px 8px", background: "#16a34a20", color: "#16a34a", borderRadius: "20px", fontSize: "11px", fontWeight: 600 }}>
                {list.reduce((s, c) => s + c.credits, 0)} credits
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-muted)" }}>
                    {["Code", "Intitulé", "UE", "Crédits", "Heures", "Enseignant"].map((h) => (
                      <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((course) => (
                    <tr key={course.id} style={{ borderTop: "1px solid var(--border-muted)" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#B91C2F", fontSize: "12px" }}>{course.code}</span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: "1px" }}>{course.name}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{course.ueName}</p>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>{course.ueCode}</span>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ fontWeight: 700, color: "#2563eb", fontSize: "14px" }}>{course.credits}</span>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                        {course.totalHours}h
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {course.teacher ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#B91C2F20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <User style={{ width: "14px", height: "14px", color: "#B91C2F" }} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: "12px", color: "var(--text)" }}>{course.teacher.firstName} {course.teacher.lastName}</p>
                              {course.teacher.speciality && <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{course.teacher.speciality}</p>}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>Non assigné</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
}

export default async function MatieresPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["ETUDIANT", "PARENT"].includes(role)) redirect("/dashboard");

  if (role === "ETUDIANT") {
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
      include: { filiere: { select: { id: true, name: true, code: true, coursesPublished: true } } },
    });

    return (
      <div style={{ maxWidth: "1200px" }}>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <Link href="/pedagogie" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)", textDecoration: "none", fontWeight: 500 }}>
              <ArrowLeft style={{ width: "13px", height: "13px" }} />Pédagogie
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
            <BookMarked style={{ width: "22px", height: "22px", color: "#B91C2F" }} />
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>Mes Matières</h1>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Liste des cours de votre filière pour l&apos;année 2025-2026
          </p>
        </div>

        {!student?.filiere ? (
          <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", padding: "60px", textAlign: "center" }}>
            <BookMarked style={{ width: "40px", height: "40px", color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Aucune filière associée</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Votre compte n&apos;est pas encore lié à une filière.</p>
          </div>
        ) : !student.filiere.coursesPublished ? (
          <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", padding: "60px", textAlign: "center" }}>
            <Lock style={{ width: "40px", height: "40px", color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Liste non encore publiée</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              La liste des matières de la filière <strong>{student.filiere.name}</strong> n&apos;est pas encore disponible.
            </p>
          </div>
        ) : (
          <>
            <div style={{ background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border)", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{student.filiere.code} : {student.filiere.name}</span>
            </div>
            <StudentCourses filiereId={student.filiere.id} />
          </>
        )}
      </div>
    );
  }

  // PARENT
  const parent = await prisma.parent.findFirst({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          filiere: { select: { id: true, name: true, code: true, coursesPublished: true } },
        },
      },
    },
  });

  return (
    <div style={{ maxWidth: "1200px" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)", textDecoration: "none", fontWeight: 500 }}>
            <ArrowLeft style={{ width: "13px", height: "13px" }} />Tableau de bord
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
          <BookMarked style={{ width: "22px", height: "22px", color: "#B91C2F" }} />
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>Matières de mes enfants</h1>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Cours et enseignants pour chaque enfant inscrit, année 2025-2026
        </p>
      </div>

      {!parent?.students.length ? (
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", padding: "60px", textAlign: "center" }}>
          <BookMarked style={{ width: "40px", height: "40px", color: "var(--text-muted)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Aucun enfant associé</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Votre compte parent n&apos;est pas encore lié à un étudiant.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {parent.students.map((child) => (
            <div key={child.id}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#B91C2F20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User style={{ width: "18px", height: "18px", color: "#B91C2F" }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>{child.firstName} {child.lastName}</p>
                  {child.filiere && <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{child.filiere.code} : {child.filiere.name}</p>}
                </div>
              </div>
              {!child.filiere ? (
                <div style={{ background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border)", padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  Aucune filière associée.
                </div>
              ) : !child.filiere.coursesPublished ? (
                <div style={{ background: "var(--bg-card)", borderRadius: "10px", border: "1px dashed var(--border)", padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  <Lock style={{ width: "18px", height: "18px", margin: "0 auto 6px" }} />
                  Liste des matières non encore publiée.
                </div>
              ) : (
                <ChildCourses filiereId={child.filiere.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function StudentCourses({ filiereId }: { filiereId: string }) {
  const courses = await getCoursesForFiliere(filiereId);
  if (courses.length === 0) {
    return (
      <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
        Aucune matière enregistrée pour cette filière.
      </div>
    );
  }
  return <CourseTable courses={courses} />;
}

async function ChildCourses({ filiereId }: { filiereId: string }) {
  const courses = await getCoursesForFiliere(filiereId);
  if (courses.length === 0) {
    return (
      <div style={{ background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border)", padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
        Aucune matière enregistrée.
      </div>
    );
  }
  return <CourseTable courses={courses} />;
}
