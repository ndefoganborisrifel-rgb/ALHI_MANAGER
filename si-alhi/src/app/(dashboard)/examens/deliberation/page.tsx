import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateGeneralAverage, getMention } from "@/lib/grade-calculator";
import { Award, Users, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

export default async function DeliberationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ACADEMIC_YEAR = "2025-2026";
  const SEMESTER = 1;

  const filieres = await prisma.filiere.findMany({
    include: {
      students: {
        where: { status: { in: ["ACTIF", "INSCRIT"] } },
        include: {
          grades: {
            where: { academicYear: ACADEMIC_YEAR, semester: SEMESTER },
            include: { course: true },
          },
        },
        orderBy: { lastName: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // Compute stats per student
  type StudentResult = {
    id: string;
    name: string;
    matricule: string;
    average: number | null;
    credits: number;
    mention: string;
    decision: string;
    rank: number;
  };

  type FiliereResult = {
    filiereName: string;
    filiereCode: string;
    students: StudentResult[];
    totalStudents: number;
    admisCount: number;
    ajourne: number;
  };

  const filiereResults: FiliereResult[] = filieres.map((filiere) => {
    const studentResults = filiere.students.map((student) => {
      const gradeData = student.grades.map((g) => ({
        average: g.noteFinal,
        credits: g.course.credits,
      }));
      const avg = calculateGeneralAverage(gradeData);
      const validatedCredits = student.grades
        .filter((g) => (g.noteFinal ?? 0) >= 10)
        .reduce((sum, g) => sum + g.course.credits, 0);
      const mention = getMention(avg);
      const isAdmis = avg != null && avg >= 10;
      return {
        id: student.id,
        name: `${student.lastName} ${student.firstName}`,
        matricule: student.matricule,
        average: avg,
        credits: validatedCredits,
        mention,
        decision: isAdmis ? "Admis" : "Ajourné",
      };
    });

    // Sort by average descending for ranking
    const sorted = [...studentResults].sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
    const ranked = studentResults.map((s) => ({
      ...s,
      rank: sorted.findIndex((r) => r.id === s.id) + 1,
    }));

    const admisCount = ranked.filter((s) => s.decision === "Admis").length;

    return {
      filiereName: filiere.name,
      filiereCode: filiere.code,
      students: ranked,
      totalStudents: ranked.length,
      admisCount,
      ajourne: ranked.length - admisCount,
    };
  });

  const totalAll = filiereResults.reduce((s, f) => s + f.totalStudents, 0);
  const totalAdmis = filiereResults.reduce((s, f) => s + f.admisCount, 0);
  const totalAjourne = totalAll - totalAdmis;

  function getMentionBadgeClass(mention: string): string {
    switch (mention) {
      case "Très Bien": return "bg-amber-100 text-amber-800";
      case "Bien": return "bg-green-100 text-green-800";
      case "Assez Bien": return "bg-blue-100 text-blue-800";
      case "Passable": return "bg-gray-100 text-gray-700";
      default: return "bg-red-100 text-red-800";
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/examens">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
        </Link>
        <div className="h-5 w-px bg-gray-200" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#B91C2F]" />
            PV de Deliberation
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Semestre {SEMESTER}, Annee academique {ACADEMIC_YEAR}
          </p>
        </div>
      </div>

      {/* Global summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-blue-600">{totalAll}</p>
            <p className="text-sm text-gray-500 mt-1">Étudiants délibérés</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-5 text-center">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-green-600">{totalAdmis}</p>
            <p className="text-sm text-gray-500 mt-1">Admis</p>
            <p className="text-xs text-gray-400">
              {totalAll > 0 ? Math.round((totalAdmis / totalAll) * 100) : 0}% taux de réussite
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-5 text-center">
            <XCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-red-600">{totalAjourne}</p>
            <p className="text-sm text-gray-500 mt-1">Ajournés</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-filiere PV */}
      {filiereResults.map((filiere) => (
        <div key={filiere.filiereCode} className="space-y-3">
          {/* Filiere header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800">{filiere.filiereName}</h2>
              <Badge className="bg-[#B91C2F]/10 text-[#B91C2F] font-mono text-xs">{filiere.filiereCode}</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600 font-medium">
                {filiere.admisCount} admis
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-red-600 font-medium">
                {filiere.ajourne} ajournés
              </span>
              <span className="text-gray-500">
                ({filiere.totalStudents} total)
              </span>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {filiere.students.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  Aucun étudiant actif dans cette filière.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">Rang</TableHead>
                      <TableHead>Étudiant</TableHead>
                      <TableHead className="font-mono text-xs">Matricule</TableHead>
                      <TableHead className="text-center">Moyenne /20</TableHead>
                      <TableHead className="text-center">Crédits validés</TableHead>
                      <TableHead className="text-center">Mention</TableHead>
                      <TableHead className="text-center">Décision</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filiere.students
                      .sort((a, b) => a.rank - b.rank)
                      .map((student) => (
                        <TableRow
                          key={student.id}
                          className={student.decision === "Ajourné" ? "bg-red-50/30" : ""}
                        >
                          <TableCell className="text-center font-bold text-gray-500 text-sm">
                            {student.rank}
                          </TableCell>
                          <TableCell className="font-medium text-sm">{student.name}</TableCell>
                          <TableCell className="font-mono text-xs text-gray-500">
                            {student.matricule}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.average != null ? (
                              <span
                                className={`font-bold text-sm ${
                                  student.average >= 10 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {student.average.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm text-gray-700">
                            {student.credits}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`text-xs ${getMentionBadgeClass(student.mention)}`}>
                              {student.mention}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                student.decision === "Admis"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {student.decision}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Filiere stats footer */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 px-1">
            <span>
              Taux de réussite :{" "}
              <strong className="text-green-700">
                {filiere.totalStudents > 0
                  ? Math.round((filiere.admisCount / filiere.totalStudents) * 100)
                  : 0}
                %
              </strong>
            </span>
            <span>
              Moyenne de promo :{" "}
              <strong>
                {(() => {
                  const avgs = filiere.students
                    .filter((s) => s.average != null)
                    .map((s) => s.average as number);
                  if (avgs.length === 0) return "n.c.";
                  return (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2);
                })()}
                /20
              </strong>
            </span>
          </div>
        </div>
      ))}

      {filiereResults.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            <Award className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>Aucune donnée de délibération disponible.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
