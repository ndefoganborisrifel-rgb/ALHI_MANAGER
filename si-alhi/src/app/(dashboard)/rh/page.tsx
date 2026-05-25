import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCFA, getStatusLabel } from "@/lib/utils";

export default async function RHPage() {
  const teachers = await prisma.teacher.findMany({
    include: {
      user: true,
      assignments: { where: { academicYear: "2025-2026" }, include: { course: true } },
      payments: { where: { year: 2025 } },
    },
    orderBy: { lastName: "asc" },
  });

  const totalPayments = teachers.reduce(
    (sum, t) => sum + t.payments.reduce((s, p) => s + p.totalAmount, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SI-RH & Vacations</h1>
        <p className="text-gray-500 text-sm">Gestion des formateurs et des vacations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 text-center">
          <p className="text-2xl font-bold text-blue-600">{teachers.length}</p>
          <p className="text-sm text-gray-500 mt-1">Enseignants</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className="text-2xl font-bold text-green-600">{teachers.filter((t) => t.type === "PERMANENT").length}</p>
          <p className="text-sm text-gray-500 mt-1">Permanents</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className="text-xl font-bold text-[#B91C2F]">{formatCFA(totalPayments)}</p>
          <p className="text-sm text-gray-500 mt-1">Vacations payées (2025)</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Liste des enseignants</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enseignant</TableHead>
                <TableHead>Spécialité</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Taux horaire</TableHead>
                <TableHead>Cours assignés</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.firstName} {teacher.lastName}</TableCell>
                  <TableCell className="text-sm text-gray-600">{teacher.speciality ?? <span className="text-gray-300 text-xs italic">Non renseigné</span>}</TableCell>
                  <TableCell>
                    <Badge className={teacher.type === "PERMANENT" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                      {getStatusLabel(teacher.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {teacher.type === "VACATAIRE" ? (
                      <span className="text-sm font-medium">{formatCFA(teacher.hourlyRate)}/h</span>
                    ) : <span className="text-gray-300 text-xs italic">Fixe</span>}
                  </TableCell>
                  <TableCell>{teacher.assignments.length} cours</TableCell>
                  <TableCell className="text-sm text-gray-500">{teacher.email ?? teacher.user.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
