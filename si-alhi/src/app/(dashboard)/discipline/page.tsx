import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ClipboardList, UserX, Plus } from "lucide-react";

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
        attendances: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
      orderBy: { lastName: "asc" },
      take: 30,
    }),
  ]);

  const absentRate = totalAttendances > 0 ? Math.round((absentCount / totalAttendances) * 100) : 0;
  const isStaff = ["ADMIN", "SCOLARITE", "ENSEIGNANT"].includes(session.user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SI-Discipline</h1>
          <p className="text-gray-500 text-sm">Suivi des absences et de l&apos;assiduité</p>
        </div>
        {isStaff && (
          <Link href="/discipline/absences">
            <Button className="bg-[#B91C2F] text-white hover:bg-[#B91C2F]/90">
              <Plus className="w-4 h-4 mr-2" />Saisir des absences
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <ClipboardList className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-blue-600">{totalAttendances}</p>
            <p className="text-sm text-gray-500 mt-1">Émargements enregistrés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <UserX className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold text-red-600">{absentCount}</p>
            <p className="text-sm text-gray-500 mt-1">Absences totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <p className={`text-2xl font-bold ${absentRate > 20 ? "text-red-600" : "text-green-600"}`}>{absentRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Taux d&apos;absentéisme</p>
          </CardContent>
        </Card>
      </div>

      {totalAttendances === 0 && isStaff && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Aucun émargement enregistré</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Cliquez sur &quot;Saisir des absences&quot; pour enregistrer les présences et absences des étudiants.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#B91C2F]" />
            Tableau de bord par étudiant
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun étudiant actif dans le système.</p>
          ) : (
            <div className="space-y-2">
              {students.map((student) => {
                const total = student.attendances.length;
                const absent = student.attendances.filter((a) => a.status === "ABSENT").length;
                const late = student.attendances.filter((a) => a.status === "RETARD").length;
                const rate = total > 0 ? Math.round((absent / total) * 100) : 0;
                const severity = rate > 20 ? "border-red-200 bg-red-50" : rate > 10 ? "border-amber-200 bg-amber-50" : "border-gray-100";
                return (
                  <div key={student.id} className={`flex items-center justify-between p-3 rounded-lg border ${severity}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${rate > 20 ? "bg-red-200 text-red-800" : rate > 10 ? "bg-amber-200 text-amber-800" : "bg-gray-200 text-gray-700"}`}>
                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{student.lastName} {student.firstName}</p>
                        <p className="text-xs text-gray-500">{student.filiere.name}, {student.matricule}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className={`font-bold ${rate > 20 ? "text-red-600" : rate > 10 ? "text-amber-600" : "text-green-600"}`}>
                        {absent} absence{absent !== 1 ? "s" : ""}
                        {late > 0 ? `, ${late} retard${late !== 1 ? "s" : ""}` : ""}
                      </p>
                      <p className="text-xs text-gray-400">
                        {total > 0 ? `${rate}% sur ${total} séances` : "Aucune séance enregistrée"}
                      </p>
                    </div>
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
