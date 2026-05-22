import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default async function DisciplinePage() {
  const [totalAttendances, absentCount, students] = await Promise.all([
    prisma.attendance.count(),
    prisma.attendance.count({ where: { status: "ABSENT" } }),
    prisma.student.findMany({
      where: { status: { in: ["ACTIF", "INSCRIT"] } },
      include: {
        attendances: true,
      },
      take: 20,
      orderBy: { lastName: "asc" },
    }),
  ]);

  const absentRate = totalAttendances > 0 ? Math.round((absentCount / totalAttendances) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SI-Discipline</h1>
        <p className="text-gray-500 text-sm">Suivi de l&apos;assiduité et des absences</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalAttendances}</p>
          <p className="text-sm text-gray-500 mt-1">Émargements enregistrés</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
          <p className="text-sm text-gray-500 mt-1">Absences totales</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className={`text-2xl font-bold ${absentRate > 20 ? "text-red-600" : "text-green-600"}`}>{absentRate}%</p>
          <p className="text-sm text-gray-500 mt-1">Taux d&apos;absentéisme</p>
        </CardContent></Card>
      </div>

      {totalAttendances === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-700">Aucun émargement enregistré. Les enseignants peuvent saisir les présences depuis leur interface.</p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Tableau de bord assiduité par étudiant</CardTitle></CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune donnée d&apos;assiduité</p>
          ) : (
            <div className="space-y-2">
              {students.slice(0, 10).map((student) => {
                const total = student.attendances.length;
                const absent = student.attendances.filter((a) => a.status === "ABSENT").length;
                const rate = total > 0 ? Math.round((absent / total) * 100) : 0;
                return (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{student.lastName} {student.firstName}</p>
                      <p className="text-xs text-gray-500">{student.matricule}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${rate > 20 ? "text-red-600" : "text-green-600"}`}>{rate}% absences</p>
                      <p className="text-xs text-gray-500">{absent}/{total} séances</p>
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
