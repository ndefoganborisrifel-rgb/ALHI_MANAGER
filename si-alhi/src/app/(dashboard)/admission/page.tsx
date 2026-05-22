import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";
import { UserPlus } from "lucide-react";

export default async function AdmissionPage() {
  const students = await prisma.student.findMany({
    include: { filiere: true, parent: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const statusCounts = {
    PROSPECT: students.filter((s) => s.status === "PROSPECT").length,
    DOSSIER_RECU: students.filter((s) => s.status === "DOSSIER_RECU").length,
    ENTRETIEN: students.filter((s) => s.status === "ENTRETIEN").length,
    ACCEPTE: students.filter((s) => s.status === "ACCEPTE").length,
    INSCRIT: students.filter((s) => s.status === "INSCRIT").length,
    ACTIF: students.filter((s) => s.status === "ACTIF").length,
  };

  const pipeline = [
    { key: "PROSPECT", label: "Prospects", color: "bg-gray-100 border-gray-300", count: statusCounts.PROSPECT },
    { key: "DOSSIER_RECU", label: "Dossier reçu", color: "bg-orange-50 border-orange-300", count: statusCounts.DOSSIER_RECU },
    { key: "ENTRETIEN", label: "Entretien", color: "bg-yellow-50 border-yellow-300", count: statusCounts.ENTRETIEN },
    { key: "ACCEPTE", label: "Acceptés", color: "bg-blue-50 border-blue-300", count: statusCounts.ACCEPTE },
    { key: "INSCRIT", label: "Inscrits", color: "bg-green-50 border-green-300", count: statusCounts.INSCRIT },
    { key: "ACTIF", label: "Actifs", color: "bg-emerald-50 border-emerald-300", count: statusCounts.ACTIF },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SI-Admission</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion du pipeline de candidatures</p>
        </div>
        <Link href="/admission/nouveau">
          <Button><UserPlus className="w-4 h-4 mr-2" />Nouveau candidat</Button>
        </Link>
      </div>

      {/* Pipeline Kanban */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {pipeline.map((stage) => (
          <Card key={stage.key} className={`border-2 ${stage.color}`}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stage.count}</p>
              <p className="text-xs text-gray-600 mt-1">{stage.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Liste des candidats ({students.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom complet</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Filière</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.lastName} {student.firstName}</TableCell>
                  <TableCell className="font-mono text-sm">{student.matricule}</TableCell>
                  <TableCell>{student.filiere.name}</TableCell>
                  <TableCell>{formatDate(student.createdAt)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(student.status)}>{getStatusLabel(student.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admission/${student.id}`} className="text-[#B91C2F] hover:underline text-sm">
                      Voir
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
