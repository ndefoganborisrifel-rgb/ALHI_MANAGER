import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, FileText, Award, ClipboardList, ArrowRight, GraduationCap } from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui/PageUI";

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

  // For students: find their own student record to link to their bulletin
  let myStudent: { id: string; filiereId: string; bulletinsPublished: boolean } | null = null;
  if (role === "ETUDIANT" && userId) {
    const s = await prisma.student.findFirst({
      where: { userId },
      select: { id: true, filiereId: true, filiere: { select: { bulletinsPublished: true } } },
    });
    if (s) myStudent = { id: s.id, filiereId: s.filiereId, bulletinsPublished: s.filiere.bulletinsPublished };
  }

  // For parents: list their children with bulletin links
  let myChildren: { id: string; firstName: string; lastName: string; bulletinsPublished: boolean }[] = [];
  if (role === "PARENT" && userId) {
    const parent = await prisma.parent.findFirst({
      where: { userId },
      include: { students: { include: { filiere: { select: { bulletinsPublished: true } } } } },
    });
    if (parent) {
      myChildren = parent.students.map((c) => ({
        id: c.id, firstName: c.firstName, lastName: c.lastName,
        bulletinsPublished: c.filiere.bulletinsPublished,
      }));
    }
  }

  const actions = [
    ...(canEnterGrades ? [{ label: "Saisir les notes CC1, CC2, Examen", href: "/examens/saisie", icon: BookOpen, desc: "Remplir les notes des etudiants par cours" }] : []),
    ...(canManage ? [{ label: "Consulter et publier les bulletins", href: "/examens/bulletins", icon: FileText, desc: "Bulletins semestriels par etudiant" }] : []),
    ...(canEnterGrades ? [
      { label: "PV de notes (CC et Examen)", href: "/examens/pv", icon: ClipboardList, desc: "Proces-verbal officiel des notes" },
    ] : []),
    ...(canManage ? [{ label: "PV de deliberation", href: "/examens/deliberation", icon: Award, desc: "Deliberation et decisions du jury" }] : []),
  ];

  return (
    <div style={{ maxWidth: "1100px" }}>
      <PageHeader
        title="SI-Examens et Notes"
        subtitle="Saisie des notes et generation des bulletins, 2025-2026"
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
        <StatCard label="Filieres" value={filieres.length} icon={<Award style={{ width: "18px", height: "18px", color: "#B91C2F" }} />} color="#B91C2F" bg="#fef2f2" sub="programmes" />
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

      {/* Parent : list children */}
      {role === "PARENT" && myChildren.length > 0 && (
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Bulletins de mes enfants</span>
          </div>
          <div style={{ padding: "6px" }}>
            {myChildren.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <GraduationCap style={{ width: "18px", height: "18px", color: "#B91C2F" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>{c.firstName} {c.lastName}</p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {c.bulletinsPublished ? "Bulletin publie" : "Bulletin non encore publie"}
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
