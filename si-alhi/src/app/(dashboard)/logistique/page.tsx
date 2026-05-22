import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default async function LogistiquePage() {
  const equipment = await prisma.equipment.findMany({
    include: { room: true },
    orderBy: { category: "asc" },
  });

  const now = new Date();
  const maintenanceDue = equipment.filter(
    (e) => e.nextMaintenanceDate && e.nextMaintenanceDate < now
  ).length;
  const fonctionnel = equipment.filter((e) => e.status === "FONCTIONNEL").length;
  const enPanne = equipment.filter((e) => e.status === "EN_PANNE").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SI-Logistique</h1>
        <p className="text-gray-500 text-sm">Inventaire et gestion du patrimoine</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{equipment.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total équipements</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{fonctionnel}</p>
          <p className="text-xs text-gray-500 mt-1">Fonctionnels</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{enPanne}</p>
          <p className="text-xs text-gray-500 mt-1">En panne</p>
        </CardContent></Card>
        <Card className={maintenanceDue > 0 ? "border-orange-300" : ""}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{maintenanceDue}</p>
            <p className="text-xs text-gray-500 mt-1">Maintenance due</p>
          </CardContent>
        </Card>
      </div>

      {maintenanceDue > 0 && (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
          <p className="text-sm text-orange-700">{maintenanceDue} équipement(s) nécessite(nt) une maintenance préventive.</p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Inventaire ({equipment.length} équipements)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Équipement</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Salle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Prochain entretien</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((eq) => {
                const maintenanceOverdue = eq.nextMaintenanceDate && eq.nextMaintenanceDate < now;
                return (
                  <TableRow key={eq.id} className={maintenanceOverdue ? "bg-orange-50/30" : ""}>
                    <TableCell className="font-mono text-xs">{eq.code}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{eq.name}</div>
                      {eq.brand && <div className="text-xs text-gray-500">{eq.brand}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{eq.category}</TableCell>
                    <TableCell className="text-sm">{eq.room?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(eq.status)}>{getStatusLabel(eq.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${maintenanceOverdue ? "text-orange-600 font-medium" : "text-gray-600"}`}>
                        {eq.nextMaintenanceDate ? formatDate(eq.nextMaintenanceDate) : "—"}
                        {maintenanceOverdue && " ⚠️"}
                      </span>
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
