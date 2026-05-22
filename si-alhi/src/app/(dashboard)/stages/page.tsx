import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";

export default async function StagesPage() {
  const internships = await prisma.internship.findMany({
    include: { student: { include: { filiere: true } } },
    orderBy: { createdAt: "desc" },
  });

  const statusCounts = {
    EN_RECHERCHE: internships.filter((i) => i.status === "EN_RECHERCHE").length,
    CONVENTION_SIGNEE: internships.filter((i) => i.status === "CONVENTION_SIGNEE").length,
    EN_COURS: internships.filter((i) => i.status === "EN_COURS").length,
    TERMINE: internships.filter((i) => i.status === "TERMINE").length,
    SOUTENU: internships.filter((i) => i.status === "SOUTENU").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SI-Stage</h1>
        <p className="text-gray-500 text-sm">Suivi des stages et conventions</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{count}</p>
              <p className="text-xs text-gray-500 mt-1">{getStatusLabel(status)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Conventions de stage ({internships.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Étudiant</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {internships.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{i.student.lastName} {i.student.firstName}</div>
                    <div className="text-xs text-gray-500">{i.student.filiere.name}</div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{i.companyName}</TableCell>
                  <TableCell className="text-sm max-w-48 truncate">{i.topic ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {i.startDate && i.endDate ? `${formatDate(i.startDate)} → ${formatDate(i.endDate)}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(i.status)}>{getStatusLabel(i.status)}</Badge>
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
