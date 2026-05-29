import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, PenLine, Info, Eye } from "lucide-react";
import { getTeacherCourseIds } from "@/lib/authz";
import { PageHeader } from "@/components/ui/PageUI";

export default async function SaisieNotesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const allowedRoles = ["ADMIN", "SCOLARITE", "ENSEIGNANT"];
  if (!allowedRoles.includes(role)) {
    redirect("/dashboard");
  }

  const isStaff = role === "ADMIN" || role === "SCOLARITE";
  const ownedCourseIds = role === "ENSEIGNANT" ? new Set(await getTeacherCourseIds(session.user.id)) : new Set<string>();
  const canEdit = (courseId: string) => isStaff || ownedCourseIds.has(courseId);

  const courses = await prisma.course.findMany({
    include: {
      ue: true,
      filiere: true,
    },
    orderBy: { code: "asc" },
  });

  // Group courses by filiere then by UE
  type CourseWithRelations = (typeof courses)[number];
  const coursesByFiliere: Record<string, { filiereName: string; ues: Record<string, CourseWithRelations[]> }> = {};

  for (const course of courses) {
    const fKey = course.filiereId;
    if (!coursesByFiliere[fKey]) {
      coursesByFiliere[fKey] = {
        filiereName: course.filiere.name,
        ues: {},
      };
    }
    const ueKey = course.ue?.code ?? "Sans UE";
    if (!coursesByFiliere[fKey].ues[ueKey]) {
      coursesByFiliere[fKey].ues[ueKey] = [];
    }
    coursesByFiliere[fKey].ues[ueKey].push(course);
  }

  return (
    <div className="space-y-6" style={{ maxWidth: "1200px" }}>
      <PageHeader
        title="Saisie des notes"
        subtitle="Annee academique 2025-2026"
        backHref="/examens"
        icon={<PenLine style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
      />

      {/* Info banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Comment saisir les notes ?</p>
              <p>
                La saisie des notes s&apos;effectue par cours. Cliquez sur le bouton{" "}
                <strong>Saisir</strong> à côté de chaque cours pour accéder au formulaire de
                saisie individuelle. Vous pourrez y entrer le CC1, CC2 et la note d&apos;examen
                pour chaque étudiant inscrit.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses grouped by filiere and UE */}
      {Object.entries(coursesByFiliere).map(([filiereId, filiereData]) => (
        <div key={filiereId} className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#B91C2F]" />
            <h2 className="text-lg font-semibold text-gray-800">{filiereData.filiereName}</h2>
            <Badge className="bg-[#B91C2F]/10 text-[#B91C2F]">
              {Object.values(filiereData.ues).flat().length} cours
            </Badge>
          </div>

          {Object.entries(filiereData.ues).map(([ueCode, ueCourses]) => {
            const ue = ueCourses[0]?.ue;
            return (
              <Card key={ueCode}>
                <CardHeader className="pb-2 border-b border-gray-100">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="font-mono bg-[#B91C2F]/10 text-[#B91C2F] px-2 py-0.5 rounded text-xs">
                      {ueCode}
                    </span>
                    {ue?.name ?? "Unité d'enseignement"}
                    {ue?.totalCredits != null && (
                      <span className="ml-auto text-xs font-normal text-gray-400">
                        {ue.totalCredits} crédits
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-28">Code</TableHead>
                        <TableHead>Matière</TableHead>
                        <TableHead className="text-center w-20">Crédits</TableHead>
                        <TableHead className="text-center w-20">Semestre</TableHead>
                        <TableHead className="text-center w-20">Volume h.</TableHead>
                        <TableHead className="w-28 text-right pr-4">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ueCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-mono text-xs text-gray-500">
                            {course.code}
                          </TableCell>
                          <TableCell className="font-medium text-sm text-gray-900">
                            {course.name}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            <Badge className="bg-blue-100 text-blue-800 font-mono text-xs">
                              {course.credits}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm text-gray-600">
                            S{course.semester}
                          </TableCell>
                          <TableCell className="text-center text-sm text-gray-600">
                            {course.totalHours != null ? `${course.totalHours}h` : <span className="text-gray-300">-</span>}
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <Link href={`/examens/saisie/${course.id}`}>
                              {canEdit(course.id) ? (
                                <Button size="sm" className="bg-[#B91C2F] hover:bg-[#B91C2F]/90 text-white">
                                  <PenLine className="w-3.5 h-3.5 mr-1.5" />
                                  Saisir
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" className="text-gray-600">
                                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                                  Consulter
                                </Button>
                              )}
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}

      {courses.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">Aucun cours enregistré dans le système.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
