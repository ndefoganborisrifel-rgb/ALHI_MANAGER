import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Award } from "lucide-react";

export default async function ExamensPage() {
  const session = await auth();
  const role = session?.user.role ?? "ETUDIANT";

  const [filieres, totalGrades, students] = await Promise.all([
    prisma.filiere.findMany({ orderBy: { name: "asc" } }),
    prisma.grade.count({ where: { academicYear: "2025-2026" } }),
    prisma.student.count({ where: { status: { in: ["ACTIF", "INSCRIT"] } } }),
  ]);

  const canEnterGrades = ["ADMIN", "SCOLARITE", "ENSEIGNANT"].includes(role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SI-Examens &amp; Notes</h1>
          <p className="text-gray-500 text-sm">Saisie des notes et génération des bulletins — 2025-2026</p>
        </div>
        <div className="flex gap-2">
          {canEnterGrades && (
            <Link href="/examens/saisie">
              <Button variant="outline"><BookOpen className="w-4 h-4 mr-2" />Saisir les notes</Button>
            </Link>
          )}
          <Link href="/examens/bulletins">
            <Button><FileText className="w-4 h-4 mr-2" />Bulletins</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{totalGrades}</p>
                <p className="text-sm text-gray-500">Notes saisies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{students}</p>
                <p className="text-sm text-gray-500">Étudiants actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <Award className="w-6 h-6 text-[#B91C2F]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{filieres.length}</p>
                <p className="text-sm text-gray-500">Filières</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {canEnterGrades && (
              <Link href="/examens/saisie">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 cursor-pointer transition-colors">
                  <div className="p-2 bg-[#B91C2F]/10 rounded-lg">
                    <BookOpen className="w-4 h-4 text-[#B91C2F]" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Saisir les notes CC1, CC2, Examen</span>
                </div>
              </Link>
            )}
            <Link href="/examens/bulletins">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 cursor-pointer transition-colors">
                <div className="p-2 bg-[#B91C2F]/10 rounded-lg">
                  <FileText className="w-4 h-4 text-[#B91C2F]" />
                </div>
                <span className="text-sm font-medium text-gray-700">Consulter et imprimer les bulletins</span>
              </div>
            </Link>
            {canEnterGrades && (
              <Link href="/examens/deliberation">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 cursor-pointer transition-colors">
                  <div className="p-2 bg-[#B91C2F]/10 rounded-lg">
                    <Award className="w-4 h-4 text-[#B91C2F]" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">PV de délibération</span>
                </div>
              </Link>
            )}
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
                    <p className="text-xs text-gray-500 font-mono">{f.code}</p>
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
