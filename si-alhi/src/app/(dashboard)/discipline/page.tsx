import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ClipboardList, UserX, Plus } from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/ui/PageUI";

export default async function DisciplinePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [totalAttendances, absentCount, students] = await Promise.all([
    prisma.attendance.count(),
    prisma.attendance.count({ where: { status: "ABSENT" } }),
    prisma.student.findMany({
      where: { status: { in: ["ACTIF", "INSCRIT"] } },
      include: {
        filiere: true,
        attendances: { orderBy: { date: "desc" }, take: 30 },
      },
      orderBy: { lastName: "asc" },
      take: 30,
    }),
  ]);

  const absentRate = totalAttendances > 0 ? Math.round((absentCount / totalAttendances) * 100) : 0;
  const isStaff = ["ADMIN", "SCOLARITE", "ENSEIGNANT"].includes(session.user.role);

  return (
    <div style={{ maxWidth: "1100px" }}>
      <PageHeader
        title="SI-Discipline"
        subtitle="Suivi des absences et de l'assiduite"
        backHref="/dashboard"
        icon={<ClipboardList style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
        actions={isStaff ? (
          <Link href="/discipline/absences" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 18px", background: "#B91C2F", color: "white", borderRadius: "10px", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>
            <Plus style={{ width: "15px", height: "15px" }} />Saisir des absences
          </Link>
        ) : undefined}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "20px" }}>
        <StatCard label="Emargements" value={totalAttendances} icon={<ClipboardList style={{ width: "18px", height: "18px", color: "#2563eb" }} />} color="#2563eb" bg="#eff6ff" sub="seances enregistrees" />
        <StatCard label="Absences totales" value={absentCount} icon={<UserX style={{ width: "18px", height: "18px", color: "#dc2626" }} />} color="#dc2626" bg="#fef2f2" sub="toutes filieres" />
        <StatCard label="Taux absenteisme" value={`${absentRate}%`} icon={<AlertTriangle style={{ width: "18px", height: "18px", color: absentRate > 20 ? "#dc2626" : "#16a34a" }} />} color={absentRate > 20 ? "#dc2626" : "#16a34a"} bg={absentRate > 20 ? "#fef2f2" : "#f0fdf4"} sub="moyenne globale" />
      </div>

      {totalAttendances === 0 && isStaff && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px" }}>
          <AlertTriangle style={{ width: "18px", height: "18px", color: "#d97706", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "13px", color: "#b45309", fontWeight: 600 }}>Aucun emargement enregistre</p>
            <p style={{ fontSize: "12px", color: "#b45309", marginTop: "2px" }}>Cliquez sur "Saisir des absences" pour enregistrer les presences et absences des etudiants.</p>
          </div>
        </div>
      )}

      <Panel title="Tableau de bord par etudiant" icon={<ClipboardList style={{ width: "15px", height: "15px", color: "#B91C2F" }} />}>
        {students.length === 0 ? (
          <EmptyState icon={<UserX style={{ width: "24px", height: "24px" }} />} message="Aucun etudiant actif dans le systeme." />
        ) : (
          <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {students.map((student) => {
              const total = student.attendances.length;
              const absent = student.attendances.filter((a) => a.status === "ABSENT").length;
              const late = student.attendances.filter((a) => a.status === "RETARD").length;
              const rate = total > 0 ? Math.round((absent / total) * 100) : 0;
              const tone = rate > 20 ? "#dc2626" : rate > 10 ? "#d97706" : "#16a34a";
              const rowBg = rate > 20 ? "var(--red-bg)" : rate > 10 ? "#fff7ed" : "var(--bg-muted)";
              return (
                <div key={student.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "10px", background: rowBg, border: "1px solid var(--border-muted)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, background: `${tone}20`, color: tone, flexShrink: 0 }}>
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--text)" }}>{student.lastName} {student.firstName}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{student.filiere.name}, {student.matricule}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 700, fontSize: "13px", color: tone }}>
                      {absent} absence{absent !== 1 ? "s" : ""}{late > 0 ? `, ${late} retard${late !== 1 ? "s" : ""}` : ""}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {total > 0 ? `${rate}% sur ${total} seances` : "Aucune seance enregistree"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
