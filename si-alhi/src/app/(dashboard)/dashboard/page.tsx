import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { ParentDashboard } from "@/components/dashboard/ParentDashboard";

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user.role ?? "";

  if (role === "ADMIN" || role === "SCOLARITE") {
    const [studentCount, teacherCount, paymentsData, recentStudents, pendingCount, courseCount, filieres] = await Promise.all([
      prisma.student.count({ where: { status: { in: ["ACTIF", "INSCRIT"] } } }),
      prisma.teacher.count(),
      prisma.payment.findMany({
        where: { status: "VALIDE", academicYear: "2025-2026" },
        select: { amount: true },
      }),
      prisma.student.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { filiere: true },
      }),
      prisma.student.count({ where: { status: { in: ["PROSPECT", "DOSSIER_RECU", "ENTRETIEN", "ACCEPTE"] } } }),
      prisma.course.count(),
      prisma.filiere.findMany({
        include: {
          _count: {
            select: {
              students: { where: { status: { in: ["ACTIF", "INSCRIT"] } } },
            },
          },
        },
        orderBy: { code: "asc" },
      }),
    ]);

    const totalCollected = paymentsData.reduce((sum, p) => sum + p.amount, 0);
    const totalExpected = filieres.reduce((sum, f) => sum + f._count.students * f.totalFees, 0);

    return (
      <AdminDashboard
        studentCount={studentCount}
        teacherCount={teacherCount}
        totalCollected={totalCollected}
        totalExpected={totalExpected}
        pendingCount={pendingCount}
        courseCount={courseCount}
        userName={session?.user.name ?? "Directrice"}
        filiereStats={filieres.map((f) => ({ code: f.code, name: f.name, count: f._count.students }))}
        recentStudents={recentStudents.map((s) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          matricule: s.matricule,
          filiere: s.filiere.name,
          filiereCode: s.filiere.code,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    );
  }

  if (role === "ENSEIGNANT") {
    return <TeacherDashboard userId={session?.user.id ?? ""} />;
  }

  if (role === "ETUDIANT") {
    return <StudentDashboard userId={session?.user.id ?? ""} />;
  }

  if (role === "PARENT") {
    return <ParentDashboard userId={session?.user.id ?? ""} />;
  }

  return <div className="text-center py-12 text-gray-500">Role non reconnu</div>;
}
