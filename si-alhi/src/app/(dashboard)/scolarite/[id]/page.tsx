import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCFA, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { ArrowLeft, Download } from "lucide-react";
import { NouveauPaiementForm } from "./NouveauPaiementForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ScolariteStudentPage({ params }: PageProps) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      filiere: true,
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });

  if (!student) notFound();

  const totalPaid = student.payments
    .filter((p) => p.status === "VALIDE")
    .reduce((sum, p) => sum + p.amount, 0);
  const balance = student.filiere.totalFees - totalPaid;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/scolarite"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Retour</Button></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{student.lastName} {student.firstName}</h1>
          <p className="text-sm text-gray-500">{student.matricule} — {student.filiere.name}</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">Frais totaux</p>
            <p className="text-xl font-bold text-blue-600">{formatCFA(student.filiere.totalFees)}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">Payé</p>
            <p className="text-xl font-bold text-green-600">{formatCFA(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className={`${balance > 0 ? "border-red-200" : "border-green-200"}`}>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">Solde restant</p>
            <p className={`text-xl font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
              {balance <= 0 ? "Soldé ✓" : formatCFA(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment History */}
        <Card>
          <CardHeader><CardTitle>Historique des versements</CardTitle></CardHeader>
          <CardContent className="p-0">
            {student.payments.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">Aucun paiement enregistré</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Reçu</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.receiptNumber}</TableCell>
                      <TableCell className="text-sm">{formatDate(p.paymentDate)}</TableCell>
                      <TableCell className="font-medium">{formatCFA(p.amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(p.status)}>{getStatusLabel(p.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/print/receipt/${p.id}`} target="_blank">
                          <Button variant="ghost" size="sm"><Download className="w-3 h-3" /></Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* New Payment Form */}
        <NouveauPaiementForm
          studentId={student.id}
          studentName={`${student.lastName} ${student.firstName}`}
          balance={balance}
        />
      </div>
    </div>
  );
}
