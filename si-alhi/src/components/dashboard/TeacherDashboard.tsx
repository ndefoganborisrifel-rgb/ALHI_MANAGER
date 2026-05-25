import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users } from "lucide-react";

export async function TeacherDashboard({ userId }: { userId: string }) {
  const teacher = await prisma.teacher.findFirst({ where: { userId } });
  const assignments = teacher
    ? await prisma.courseAssignment.findMany({
        where: { teacherId: teacher.id, academicYear: "2025-2026" },
        include: { course: true },
      })
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon espace enseignant</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cours assignés</p>
              <p className="text-2xl font-bold text-blue-600">{assignments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Mes cours</CardTitle></CardHeader>
        <CardContent>
          {assignments.length === 0 && <p className="text-gray-500 text-sm">Aucun cours assigné</p>}
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-sm text-gray-900">{a.course.name}</p>
                  <p className="text-xs text-gray-500">Code : {a.course.code}, {a.course.credits} crédits</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
