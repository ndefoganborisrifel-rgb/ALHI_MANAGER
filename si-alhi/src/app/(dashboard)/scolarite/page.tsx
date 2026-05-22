import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCFA, formatDate } from "@/lib/utils";
import { CreditCard, AlertCircle, CheckCircle } from "lucide-react";

export default async function ScolaritePage() {
  const students = await prisma.student.findMany({
    include: {
      filiere: true,
      payments: { where: { status: "VALIDE" } },
    },
    where: { status: { in: ["ACTIF", "INSCRIT"] } },
    orderBy: { lastName: "asc" },
  });

  const totalExpected = students.reduce((sum, s) => sum + s.filiere.totalFees, 0);
  const totalCollected = students.reduce(
    (sum, s) => sum + s.payments.reduce((ps, p) => ps + p.amount, 0),
    0
  );
  const recoveryRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
  const studentsWithDebt = students.filter((s) => {
    const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
    return paid < s.filiere.totalFees;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SI-Scolarité</h1>
        <p className="text-gray-500 text-sm mt-1">Gestion des paiements et du recouvrement</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-full"><CheckCircle className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Collecté</p>
                <p className="text-xl font-bold text-green-600">{formatCFA(totalCollected)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-full"><CreditCard className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Taux de recouvrement</p>
                <p className="text-xl font-bold text-blue-600">{recoveryRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 rounded-full"><AlertCircle className="w-5 h-5 text-red-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Étudiants avec solde</p>
                <p className="text-xl font-bold text-red-600">{studentsWithDebt}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>État des paiements ({students.length} étudiants actifs)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Étudiant</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Filière</TableHead>
                <TableHead>Frais totaux</TableHead>
                <TableHead>Payé</TableHead>
                <TableHead>Solde</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
                const balance = student.filiere.totalFees - totalPaid;
                const isPaidFull = balance <= 0;
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.lastName} {student.firstName}</TableCell>
                    <TableCell className="font-mono text-xs">{student.matricule}</TableCell>
                    <TableCell className="text-sm">{student.filiere.name}</TableCell>
                    <TableCell>{formatCFA(student.filiere.totalFees)}</TableCell>
                    <TableCell className="text-green-700 font-medium">{formatCFA(totalPaid)}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${isPaidFull ? "text-green-600" : "text-red-600"}`}>
                        {isPaidFull ? "Soldé" : formatCFA(balance)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/scolarite/${student.id}`} className="text-[#B91C2F] hover:underline text-sm">
                        Gérer
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
