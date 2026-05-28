"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AlertTriangle, Monitor, Building2, Projector, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";

type Room = {
  id: string;
  code: string;
  name: string;
  capacity: number;
  building?: string | null;
  floor?: string | null;
  hasProjector: boolean;
  hasComputers: boolean;
  isAvailable: boolean;
  _count: { equipment: number; schedules: number };
  equipment?: { id: string }[];
};

type Equipment = {
  id: string;
  code: string;
  name: string;
  category: string;
  brand?: string | null;
  roomId?: string | null;
  status: string;
  purchasePrice?: number | null;
  nextMaintenanceDate?: string | null;
  room?: { name: string } | null;
};

const emptyRoomForm = { code: "", name: "", capacity: "", building: "", floor: "", hasProjector: false, hasComputers: false };
const emptyEqForm = { code: "", name: "", category: "", brand: "", roomId: "", status: "FONCTIONNEL", purchasePrice: "" };

export default function LogistiquePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Room modal state
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [roomSubmitting, setRoomSubmitting] = useState(false);
  const [roomError, setRoomError] = useState("");

  // Equipment modal state
  const [showEqModal, setShowEqModal] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [eqForm, setEqForm] = useState(emptyEqForm);
  const [eqSubmitting, setEqSubmitting] = useState(false);
  const [eqError, setEqError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [roomsRes, eqRes] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/equipment"),
      ]);
      if (!roomsRes.ok || !eqRes.ok) throw new Error("Erreur de chargement");
      setRooms(await roomsRes.json());
      setEquipment(await eqRes.json());
    } catch {
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const now = new Date();
  const maintenanceDue = equipment.filter((e) => e.nextMaintenanceDate && new Date(e.nextMaintenanceDate) < now).length;
  const fonctionnel = equipment.filter((e) => e.status === "FONCTIONNEL").length;
  const enPanne = equipment.filter((e) => e.status === "EN_PANNE").length;
  const roomsAvailable = rooms.filter((r) => r.isAvailable).length;

  function openAddRoom() {
    setEditingRoom(null);
    setRoomForm(emptyRoomForm);
    setRoomError("");
    setShowRoomModal(true);
  }

  function openEditRoom(room: Room) {
    setEditingRoom(room);
    setRoomForm({
      code: room.code,
      name: room.name,
      capacity: String(room.capacity),
      building: room.building ?? "",
      floor: room.floor ?? "",
      hasProjector: room.hasProjector,
      hasComputers: room.hasComputers,
    });
    setRoomError("");
    setShowRoomModal(true);
  }

  async function handleDeleteRoom(room: Room) {
    if (!confirm(`Supprimer la salle ${room.code} ? Cette action est irréversible.`)) return;
    const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Erreur lors de la suppression.");
      return;
    }
    loadData();
  }

  async function handleRoomSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRoomSubmitting(true);
    setRoomError("");
    try {
      const payload = {
        code: roomForm.code.trim(),
        name: roomForm.name.trim(),
        capacity: parseInt(roomForm.capacity),
        building: roomForm.building.trim() || undefined,
        floor: roomForm.floor.trim() || undefined,
        hasProjector: roomForm.hasProjector,
        hasComputers: roomForm.hasComputers,
      };
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : "/api/rooms";
      const method = editingRoom ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setRoomError(data.error ?? "Erreur."); return; }
      setShowRoomModal(false);
      loadData();
    } finally {
      setRoomSubmitting(false);
    }
  }

  function openAddEq() {
    setEditingEq(null);
    setEqForm(emptyEqForm);
    setEqError("");
    setShowEqModal(true);
  }

  function openEditEq(eq: Equipment) {
    setEditingEq(eq);
    setEqForm({
      code: eq.code,
      name: eq.name,
      category: eq.category,
      brand: eq.brand ?? "",
      roomId: eq.roomId ?? "",
      status: eq.status,
      purchasePrice: eq.purchasePrice != null ? String(eq.purchasePrice) : "",
    });
    setEqError("");
    setShowEqModal(true);
  }

  async function handleDeleteEq(eq: Equipment) {
    if (!confirm(`Supprimer "${eq.name}" ? Cette action est irréversible.`)) return;
    const res = await fetch(`/api/equipment/${eq.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Erreur lors de la suppression.");
      return;
    }
    loadData();
  }

  async function handleEqSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEqSubmitting(true);
    setEqError("");
    try {
      const payload: Record<string, unknown> = {
        code: eqForm.code.trim(),
        name: eqForm.name.trim(),
        category: eqForm.category.trim(),
        brand: eqForm.brand.trim() || undefined,
        roomId: eqForm.roomId || undefined,
        status: eqForm.status,
        purchasePrice: eqForm.purchasePrice ? parseInt(eqForm.purchasePrice) : undefined,
      };
      const url = editingEq ? `/api/equipment/${editingEq.id}` : "/api/equipment";
      const method = editingEq ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setEqError(data.error ?? "Erreur."); return; }
      setShowEqModal(false);
      loadData();
    } finally {
      setEqSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>;
  if (error) return <div className="text-red-600 p-4">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Retour</Button></Link>
          </div>
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
                <p className="text-xs text-gray-500">Equipements</p>
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
          <p className="text-sm text-orange-700 font-medium">{maintenanceDue} equipement(s) necessitent une maintenance preventive.</p>
        </div>
      )}

      {/* Salles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#B91C2F]" />
            Salles et Espaces ({rooms.length}), {roomsAvailable} disponibles
          </h2>
          <Button size="sm" className="bg-[#B91C2F] hover:bg-[#9b1727] text-white" onClick={openAddRoom}>
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
                    <span className="text-gray-500">Capacite</span>
                    <span className="font-semibold text-gray-900">{room.capacity} places</span>
                  </div>
                  {room.building && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Batiment</span>
                      <span className="font-medium text-gray-700">{room.building}{room.floor ? `, ${room.floor}` : ""}</span>
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
                    <span className="text-gray-500">{room._count.schedules} cours planifies</span>
                    <span className="text-gray-500">{room._count.equipment} equip.</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEditRoom(room)}>
                      <Pencil className="w-3 h-3 mr-1" />Modifier
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs text-red-600 hover:text-red-700" onClick={() => handleDeleteRoom(room)}>
                      <Trash2 className="w-3 h-3 mr-1" />Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Equipements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Inventaire des equipements ({equipment.length})</h2>
          <Button size="sm" className="bg-[#B91C2F] hover:bg-[#9b1727] text-white" onClick={openAddEq}>
            <Plus className="w-4 h-4 mr-1" />Ajouter un equipement
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Code</TableHead>
                  <TableHead>Equipement</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Salle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Prochain entretien</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((eq) => {
                  const maintenanceOverdue = eq.nextMaintenanceDate && new Date(eq.nextMaintenanceDate) < now;
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
                      <TableCell className="text-sm text-gray-600">{eq.room?.name ?? <span className="text-gray-300">-</span>}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(eq.status)}>{getStatusLabel(eq.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${maintenanceOverdue ? "text-orange-600 font-medium" : "text-gray-500"}`}>
                          {eq.nextMaintenanceDate ? formatDate(eq.nextMaintenanceDate) : <span className="text-gray-300">-</span>}
                          {maintenanceOverdue && " !"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => openEditEq(eq)}>Modifier</Button>
                          <Button variant="outline" size="sm" className="text-xs h-7 text-red-600 hover:text-red-700" onClick={() => handleDeleteEq(eq)}>Supprimer</Button>
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

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowRoomModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editingRoom ? "Modifier la salle" : "Ajouter une salle"}</h2>
            <form onSubmit={handleRoomSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room-code">Code</Label>
                  <Input id="room-code" value={roomForm.code} onChange={(e) => setRoomForm((f) => ({ ...f, code: e.target.value }))} required placeholder="A101" />
                </div>
                <div>
                  <Label htmlFor="room-capacity">Capacite</Label>
                  <Input id="room-capacity" type="number" min={1} value={roomForm.capacity} onChange={(e) => setRoomForm((f) => ({ ...f, capacity: e.target.value }))} required placeholder="30" />
                </div>
              </div>
              <div>
                <Label htmlFor="room-name">Nom</Label>
                <Input id="room-name" value={roomForm.name} onChange={(e) => setRoomForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Salle informatique" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room-building">Batiment</Label>
                  <Input id="room-building" value={roomForm.building} onChange={(e) => setRoomForm((f) => ({ ...f, building: e.target.value }))} placeholder="Bloc A" />
                </div>
                <div>
                  <Label htmlFor="room-floor">Etage</Label>
                  <Input id="room-floor" value={roomForm.floor} onChange={(e) => setRoomForm((f) => ({ ...f, floor: e.target.value }))} placeholder="1er etage" />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={roomForm.hasProjector} onChange={(e) => setRoomForm((f) => ({ ...f, hasProjector: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-700">Projecteur</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={roomForm.hasComputers} onChange={(e) => setRoomForm((f) => ({ ...f, hasComputers: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-700">Ordinateurs</span>
                </label>
              </div>
              {roomError && <p className="text-sm text-red-600">{roomError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowRoomModal(false)}>Annuler</Button>
                <Button type="submit" className="flex-1 bg-[#B91C2F] hover:bg-[#9b1727] text-white" disabled={roomSubmitting}>
                  {roomSubmitting ? "Enregistrement..." : editingRoom ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Equipment Modal */}
      {showEqModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowEqModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editingEq ? "Modifier l'equipement" : "Ajouter un equipement"}</h2>
            <form onSubmit={handleEqSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eq-code">Code</Label>
                  <Input id="eq-code" value={eqForm.code} onChange={(e) => setEqForm((f) => ({ ...f, code: e.target.value }))} required placeholder="EQ-001" />
                </div>
                <div>
                  <Label htmlFor="eq-category">Categorie</Label>
                  <Input id="eq-category" value={eqForm.category} onChange={(e) => setEqForm((f) => ({ ...f, category: e.target.value }))} required placeholder="Informatique" />
                </div>
              </div>
              <div>
                <Label htmlFor="eq-name">Nom</Label>
                <Input id="eq-name" value={eqForm.name} onChange={(e) => setEqForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Ordinateur portable" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eq-brand">Marque</Label>
                  <Input id="eq-brand" value={eqForm.brand} onChange={(e) => setEqForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Dell" />
                </div>
                <div>
                  <Label htmlFor="eq-price">Prix d'achat (FCFA)</Label>
                  <Input id="eq-price" type="number" min={0} value={eqForm.purchasePrice} onChange={(e) => setEqForm((f) => ({ ...f, purchasePrice: e.target.value }))} placeholder="250000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eq-room">Salle</Label>
                  <Select id="eq-room" value={eqForm.roomId} onChange={(e) => setEqForm((f) => ({ ...f, roomId: e.target.value }))}>
                    <option value="">Aucune salle</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eq-status">Statut</Label>
                  <Select id="eq-status" value={eqForm.status} onChange={(e) => setEqForm((f) => ({ ...f, status: e.target.value }))}>
                    <option value="FONCTIONNEL">Fonctionnel</option>
                    <option value="EN_PANNE">En panne</option>
                    <option value="EN_MAINTENANCE">En maintenance</option>
                    <option value="REFORME">Reforme</option>
                  </Select>
                </div>
              </div>
              {eqError && <p className="text-sm text-red-600">{eqError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEqModal(false)}>Annuler</Button>
                <Button type="submit" className="flex-1 bg-[#B91C2F] hover:bg-[#9b1727] text-white" disabled={eqSubmitting}>
                  {eqSubmitting ? "Enregistrement..." : editingEq ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
