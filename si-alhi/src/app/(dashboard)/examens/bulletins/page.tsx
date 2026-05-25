import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateGeneralAverage, getMention } from "@/lib/grade-calculator";
import { Download } from "lucide-react";

interface SearchParams {
  filiere?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function BulletinsPage({ searchParams }: PageProps) {
  const { filiere } = await searchParams;

  const filieres = await prisma.filiere.findMany();
  const selectedFiliere = filiere ? filieres.find((f) => f.id === filiere) : filieres[0];

  const students = selectedFiliere
    ? await prisma.student.findMany({
        where: { filiereId: selectedFiliere.id, status: { in: ["ACTIF", "INSCRIT"] } },
        include: {
          grades: {
            include: { course: true },
            where: { academicYear: "2025-2026", semester: 1 },
          },
        },
        orderBy: { lastName: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulletins de notes</h1>
        <p className="text-gray-500 text-sm">Relevés de notes semestriels — Semestre 1, 2025-2026</p>
      </div>

      {/* Filière selector */}
      <div className="flex gap-2 flex-wrap">
        {filieres.map((f) => (
          <Link key={f.id} href={`/examens/bulletins?filiere=${f.id}`}>
            <Button variant={selectedFiliere?.id === f.id ? "default" : "outline"} size="sm">{f.name}</Button>
          </Link>
        ))}
      </div>

      {selectedFiliere && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Étudiants — {selectedFiliere.name} ({students.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Moyenne</TableHead>
                  <TableHead>Crédits</TableHead>
                  <TableHead>Mention</TableHead>
                  <TableHead>Bulletin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, idx) => {
                  const gradeData = student.grades.map((g) => ({
                    average: g.noteFinal,
                    credits: g.course.credits,
                  }));
                  const avg = calculateGeneralAverage(gradeData);
                  const mention = getMention(avg);
                  const totalCredits = student.grades.filter((g) => (g.noteFinal ?? 0) >= 10).reduce((sum, g) => sum + g.course.credits, 0);

                  return (
                    <TableRow key={student.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{student.lastName} {student.firstName}</TableCell>
                      <TableCell className="font-mono text-xs">{student.matricule}</TableCell>
                      <TableCell>
                        {avg != null ? (
                          <span className={`font-bold ${avg >= 10 ? "text-green-600" : "text-red-600"}`}>
                            {avg.toFixed(2)}/20
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{totalCredits}/30</TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${avg != null && avg >= 16 ? "text-amber-600" : avg != null && avg >= 10 ? "text-green-600" : "text-red-600"}`}>
                          {mention}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/print/bulletin/${student.id}?semester=1&year=2025-2026`} target="_blank">
                          <Button variant="outline" size="sm"><Download className="w-3 h-3 mr-1" />Imprimer</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
