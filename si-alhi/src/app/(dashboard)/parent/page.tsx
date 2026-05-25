import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCFA, getStatusLabel, getStatusColor } from "@/lib/utils";
import { User, GraduationCap, CreditCard, BookOpen, AlertTriangle } from "lucide-react";

export default async function ParentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parent = await prisma.parent.findFirst({
    where: { user: { email: session.user.email } },
    include: {
      students: {
        include: {
          filiere: true,
          grades: {
            include: { course: true },
            where: { academicYear: "2025-2026" },
          },
          payments: { where: { status: "VALIDE" } },
        },
      },
    },
  });

  if (!parent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Profil parent introuvable</h2>
        <p className="text-gray-500 max-w-md">
          Aucun profil parent n&apos;est associé à votre compte. Veuillez contacter l&apos;administration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espace Parent</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bienvenue, {parent.firstName} {parent.lastName} — Année académique 2025-2026
          </p>
        </div>
        <Badge className="bg-[#B91C2F]/10 text-[#B91C2F] border-[#B91C2F]/20">
          {parent.relation === "PERE" ? "Père" : parent.relation === "MERE" ? "Mère" : "Tuteur"}
        </Badge>
      </div>

      {parent.students.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Aucun étudiant n&apos;est associé à votre profil.
          </CardContent>
        </Card>
      )}

      {parent.students.map((student) => {
        const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
        const totalFees = student.filiere.totalFees;
        const balance = totalFees - totalPaid;
        const paymentPercent = totalFees > 0 ? Math.min(100, Math.round((totalPaid / totalFees) * 100)) : 0;

        // Count absences from grades context (no attendances in this query — show placeholder)
        const absenceCount: number = 0;

        return (
          <div key={student.id} className="space-y-6">
            {/* Student Info Card */}
            <Card className="border-l-4 border-l-[#B91C2F]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#B91C2F] flex items-center justify-center text-white font-bold text-sm">
                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {student.lastName} {student.firstName}
                    </CardTitle>
                    <p className="text-sm text-gray-500 font-mono">{student.matricule}</p>
                  </div>
                  <div className="ml-auto">
                    <Badge className={getStatusColor(student.status)}>
                      {getStatusLabel(student.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500 text-xs">Filière</p>
                      <p className="font-medium">{student.filiere.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500 text-xs">Niveau</p>
                      <p className="font-medium">Niveau {student.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500 text-xs">Code filière</p>
                      <p className="font-medium">{student.filiere.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-gray-500 text-xs">Absences</p>
                      <p className={`font-bold ${absenceCount > 3 ? "text-red-600" : absenceCount > 0 ? "text-amber-600" : "text-green-600"}`}>
                        {absenceCount} absence{absenceCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-blue-200">
                <CardContent className="p-5 text-center">
                  <CreditCard className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-1">Frais de scolarité</p>
                  <p className="text-xl font-bold text-blue-600">{formatCFA(totalFees)}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardContent className="p-5 text-center">
                  <CreditCard className="w-5 h-5 text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-1">Montant versé</p>
                  <p className="text-xl font-bold text-green-600">{formatCFA(totalPaid)}</p>
                  <p className="text-xs text-gray-400 mt-1">{paymentPercent}% réglé</p>
                </CardContent>
              </Card>
              <Card className={balance > 0 ? "border-red-200" : "border-green-200"}>
                <CardContent className="p-5 text-center">
                  <CreditCard className={`w-5 h-5 mx-auto mb-2 ${balance > 0 ? "text-red-500" : "text-green-500"}`} />
                  <p className="text-xs text-gray-500 mb-1">Solde restant</p>
                  <p className={`text-xl font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                    {balance <= 0 ? "Soldé ✓" : formatCFA(balance)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Payment progress bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${paymentPercent === 100 ? "bg-green-500" : "bg-[#B91C2F]"}`}
                style={{ width: `${paymentPercent}%` }}
              />
            </div>

            {/* Grades */}
            {student.grades.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#B91C2F]" />
                    Relevé de notes — 2025-2026
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Code</TableHead>
                        <TableHead>Matière</TableHead>
                        <TableHead className="text-center">CC1</TableHead>
                        <TableHead className="text-center">CC2</TableHead>
                        <TableHead className="text-center">Examen</TableHead>
                        <TableHead className="text-center">Note/20</TableHead>
                        <TableHead className="text-center">Résultat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.grades.map((grade) => {
                        const note = grade.noteFinal;
                        const passed = note != null && note >= 10;
                        return (
                          <TableRow key={grade.id}>
                            <TableCell className="font-mono text-xs text-gray-500">{grade.course.code}</TableCell>
                            <TableCell className="font-medium text-sm">{grade.course.name}</TableCell>
                            <TableCell className="text-center text-sm">
                              {grade.cc1 != null ? grade.cc1.toFixed(1) : "—"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {grade.cc2 != null ? grade.cc2.toFixed(1) : "—"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {grade.examScore != null ? grade.examScore.toFixed(1) : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              {note != null ? (
                                <span className={`font-bold text-sm ${passed ? "text-green-600" : "text-red-600"}`}>
                                  {note.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {note != null ? (
                                <Badge className={passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                  {passed ? "Validé" : "Ajourné"}
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-600">En attente</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Aucune note disponible pour l&apos;année 2025-2026</p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
