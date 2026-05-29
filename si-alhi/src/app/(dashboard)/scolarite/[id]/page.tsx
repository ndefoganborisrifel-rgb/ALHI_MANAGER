import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCFA, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Download, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { NouveauPaiementForm } from "./NouveauPaiementForm";
import { PageHeader, StatCard } from "@/components/ui/PageUI";

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
      <PageHeader
        title={`${student.lastName} ${student.firstName}`}
        subtitle={`${student.matricule}, ${student.filiere.name}`}
        backHref="/scolarite"
        icon={<CreditCard style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
      />

      {/* Financial Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
        <StatCard label="Frais totaux" value={formatCFA(student.filiere.totalFees)} icon={<CreditCard style={{ width: "18px", height: "18px", color: "#2563eb" }} />} color="#2563eb" bg="#eff6ff" sub="scolarite annuelle" />
        <StatCard label="Paye" value={formatCFA(totalPaid)} icon={<CheckCircle style={{ width: "18px", height: "18px", color: "#16a34a" }} />} color="#16a34a" bg="#f0fdf4" sub="versements valides" />
        <StatCard label="Solde restant" value={balance <= 0 ? "Solde" : formatCFA(balance)} icon={<AlertCircle style={{ width: "18px", height: "18px", color: balance > 0 ? "#dc2626" : "#16a34a" }} />} color={balance > 0 ? "#dc2626" : "#16a34a"} bg={balance > 0 ? "#fef2f2" : "#f0fdf4"} sub={balance > 0 ? "a regler" : "compte solde"} />
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
