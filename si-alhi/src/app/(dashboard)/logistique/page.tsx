import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { AlertTriangle, Monitor, Building2, Wifi, Projector, Plus } from "lucide-react";

export default async function LogistiquePage() {
  const [equipment, rooms] = await Promise.all([
    prisma.equipment.findMany({ include: { room: true }, orderBy: { category: "asc" } }),
    prisma.room.findMany({ include: { equipment: true, _count: { select: { schedules: true } } }, orderBy: { code: "asc" } }),
  ]);

  const now = new Date();
  const maintenanceDue = equipment.filter((e) => e.nextMaintenanceDate && e.nextMaintenanceDate < now).length;
  const fonctionnel = equipment.filter((e) => e.status === "FONCTIONNEL").length;
  const enPanne = equipment.filter((e) => e.status === "EN_PANNE").length;
  const roomsAvailable = rooms.filter((r) => r.isAvailable).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SI-Logistique</h1>
          <p className="text-gray-500 text-sm">Inventaire du patrimoine et gestion des salles</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl"><Monitor className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{equipment.length}</p>
                <p className="text-xs text-gray-500">Équipements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-50 rounded-xl"><Monitor className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-green-600">{fonctionnel}</p>
                <p className="text-xs text-gray-500">Fonctionnels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-xl"><Monitor className="w-5 h-5 text-red-600" /></div>
              <div>
                <p className="text-2xl font-bold text-red-600">{enPanne}</p>
                <p className="text-xs text-gray-500">En panne</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={maintenanceDue > 0 ? "border-orange-300" : ""}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 rounded-xl"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{maintenanceDue}</p>
                <p className="text-xs text-gray-500">Maintenance due</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {maintenanceDue > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
          <p className="text-sm text-orange-700 font-medium">{maintenanceDue} équipement(s) nécessite(nt) une maintenance préventive.</p>
        </div>
      )}

      {/* Salles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#B91C2F]" />
            Salles &amp; Espaces ({rooms.length}) — {roomsAvailable} disponibles
          </h2>
          <Button size="sm" className="bg-[#B91C2F] hover:bg-[#9b1727] text-white">
            <Plus className="w-4 h-4 mr-1" />Ajouter une salle
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2d2d2d] text-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-lg">{room.code}</p>
                      <p className="text-gray-300 text-sm">{room.name}</p>
                    </div>
                    <Badge className={room.isAvailable ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                      {room.isAvailable ? "Disponible" : "Indisponible"}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Capacité</span>
                    <span className="font-semibold text-gray-900">{room.capacity} places</span>
                  </div>
                  {room.building && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Bâtiment</span>
                      <span className="font-medium text-gray-700">{room.building} — {room.floor}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    {room.hasProjector && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        <Projector className="w-3 h-3" />Projecteur
                      </div>
                    )}
                    {room.hasComputers && (
                      <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                        <Monitor className="w-3 h-3" />Ordinateurs
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm border-t pt-3">
                    <span className="text-gray-500">{room._count.schedules} cours planifiés</span>
                    <span className="text-gray-500">{room.equipment.length} équip.</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 text-xs">Modifier</Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs text-red-600 hover:text-red-700">Supprimer</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Équipements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Inventaire des équipements ({equipment.length})</h2>
          <Button size="sm" className="bg-[#B91C2F] hover:bg-[#9b1727] text-white">
            <Plus className="w-4 h-4 mr-1" />Ajouter un équipement
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Code</TableHead>
                  <TableHead>Équipement</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Salle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Prochain entretien</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((eq) => {
                  const maintenanceOverdue = eq.nextMaintenanceDate && eq.nextMaintenanceDate < now;
                  return (
                    <TableRow key={eq.id} className={maintenanceOverdue ? "bg-orange-50/40" : ""}>
                      <TableCell className="font-mono text-xs text-gray-500">{eq.code}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm text-gray-900">{eq.name}</div>
                        {eq.brand && <div className="text-xs text-gray-400">{eq.brand}</div>}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{eq.category}</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{eq.room?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(eq.status)}>{getStatusLabel(eq.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${maintenanceOverdue ? "text-orange-600 font-medium" : "text-gray-500"}`}>
                          {eq.nextMaintenanceDate ? formatDate(eq.nextMaintenanceDate) : "—"}
                          {maintenanceOverdue && " ⚠️"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="outline" size="sm" className="text-xs h-7">Modifier</Button>
                          <Button variant="outline" size="sm" className="text-xs h-7 text-red-600 hover:text-red-700">Supprimer</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
