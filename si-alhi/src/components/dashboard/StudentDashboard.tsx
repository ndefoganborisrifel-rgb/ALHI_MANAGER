import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CreditCard, Calendar } from "lucide-react";
import { formatCFA } from "@/lib/utils";

export async function StudentDashboard({ userId }: { userId: string }) {
  const student = await prisma.student.findFirst({
    where: { userId },
    include: { filiere: true, payments: { where: { status: "VALIDE" } } },
  });

  if (!student) return <div className="text-gray-500">Profil étudiant non trouvé.</div>;

  const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = (student.filiere.totalFees ?? 0) - totalPaid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {student.firstName} !</h1>
        <p className="text-gray-500 text-sm">{student.matricule}, {student.filiere.name}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full"><CreditCard className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Payé</p>
              <p className="text-lg font-bold text-green-600">{formatCFA(totalPaid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full"><CreditCard className="w-6 h-6 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Reste à payer</p>
              <p className="text-lg font-bold text-red-600">{formatCFA(balance)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
