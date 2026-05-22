import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Award } from "lucide-react";

export default async function ExamensPage() {
  const [filieres, totalGrades, students] = await Promise.all([
    prisma.filiere.findMany(),
    prisma.grade.count({ where: { academicYear: "2025-2026" } }),
    prisma.student.count({ where: { status: { in: ["ACTIF", "INSCRIT"] } } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SI-Examens & Notes</h1>
          <p className="text-gray-500 text-sm">Saisie des notes et génération des bulletins</p>
        </div>
        <div className="flex gap-2">
          <Link href="/examens/saisie"><Button variant="outline"><BookOpen className="w-4 h-4 mr-2" />Saisir les notes</Button></Link>
          <Link href="/examens/bulletins"><Button><FileText className="w-4 h-4 mr-2" />Bulletins</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 text-center">
          <p className="text-3xl font-bold text-blue-600">{totalGrades}</p>
          <p className="text-sm text-gray-500 mt-1">Notes saisies</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className="text-3xl font-bold text-green-600">{students}</p>
          <p className="text-sm text-gray-500 mt-1">Étudiants actifs</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className="text-3xl font-bold text-[#B91C2F]">{filieres.length}</p>
          <p className="text-sm text-gray-500 mt-1">Filières</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: "/examens/saisie", label: "Saisir les notes CC1, CC2, Examen", icon: BookOpen },
              { href: "/examens/bulletins", label: "Générer les bulletins PDF", icon: FileText },
              { href: "/examens/deliberation", label: "PV de délibération", icon: Award },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 cursor-pointer transition-colors">
                    <div className="p-2 bg-[#B91C2F]/10 rounded-lg">
                      <Icon className="w-4 h-4 text-[#B91C2F]" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Filières</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filieres.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{f.name}</p>
                    <p className="text-xs text-gray-500">{f.code}</p>
                  </div>
                  <Link href={`/examens/bulletins?filiere=${f.id}`}>
                    <Button variant="outline" size="sm">Bulletins</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
