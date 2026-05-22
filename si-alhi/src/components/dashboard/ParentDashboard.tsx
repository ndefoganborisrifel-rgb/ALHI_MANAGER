import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCFA } from "@/lib/utils";

export async function ParentDashboard({ userId }: { userId: string }) {
  const parent = await prisma.parent.findFirst({
    where: { userId },
    include: {
      students: {
        include: {
          filiere: true,
          payments: { where: { status: "VALIDE" } },
        },
      },
    },
  });

  if (!parent) return <div className="text-gray-500">Profil parent non trouvé.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Espace Parent</h1>
      {parent.students.map((student) => {
        const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = (student.filiere.totalFees ?? 0) - totalPaid;
        return (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle>{student.firstName} {student.lastName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Matricule</p><p className="font-medium">{student.matricule}</p></div>
                <div><p className="text-gray-500">Filière</p><p className="font-medium">{student.filiere.name}</p></div>
                <div><p className="text-gray-500">Montant payé</p><p className="font-medium text-green-600">{formatCFA(totalPaid)}</p></div>
                <div><p className="text-gray-500">Solde restant</p><p className="font-medium text-red-600">{formatCFA(balance)}</p></div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
