"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AlertTriangle, Monitor, Building2, Projector, Plus, Pencil, Trash2, Package, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader, StatCard, Panel, PrimaryButton, StatusBadge, EmptyState } from "@/components/ui/PageUI";
import { getStatusHex, getStatusLabel, formatDate } from "@/lib/utils";

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

const th: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 16px", fontSize: "13px", color: "var(--text)", verticalAlign: "middle" };

export default function LogistiquePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [roomSubmitting, setRoomSubmitting] = useState(false);
  const [roomError, setRoomError] = useState("");

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
      setError("Impossible de charger les donnees.");
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
    if (!confirm(`Supprimer la salle ${room.code} ? Cette action est irreversible.`)) return;
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
    if (!confirm(`Supprimer "${eq.name}" ? Cette action est irreversible.`)) return;
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

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "var(--text-muted)" }}>Chargement...</div>;
  if (error) return <div style={{ color: "#dc2626", padding: "1rem" }}>{error}</div>;

  return (
    <div style={{ maxWidth: "1280px" }}>
      <PageHeader
        title="SI-Logistique"
        subtitle="Inventaire du patrimoine et gestion des salles"
        backHref="/dashboard"
        icon={<Package style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
        <StatCard label="Equipements" value={equipment.length} icon={<Monitor style={{ width: "18px", height: "18px", color: "#2563eb" }} />} color="#2563eb" bg="#eff6ff" sub="parc total" />
        <StatCard label="Fonctionnels" value={fonctionnel} icon={<CheckCircle2 style={{ width: "18px", height: "18px", color: "#16a34a" }} />} color="#16a34a" bg="#f0fdf4" sub="en service" />
        <StatCard label="En panne" value={enPanne} icon={<XCircle style={{ width: "18px", height: "18px", color: "#dc2626" }} />} color="#dc2626" bg="#fef2f2" sub="a reparer" />
        <StatCard label="Maintenance due" value={maintenanceDue} icon={<AlertTriangle style={{ width: "18px", height: "18px", color: "#d97706" }} />} color="#d97706" bg="#fff7ed" sub="entretien a prevoir" />
      </div>

      {maintenanceDue > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px" }}>
          <AlertTriangle style={{ width: "18px", height: "18px", color: "#d97706", flexShrink: 0 }} />
          <p style={{ fontSize: "13px", color: "#b45309", fontWeight: 500 }}>{maintenanceDue} equipement(s) necessitent une maintenance preventive.</p>
        </div>
      )}

      {/* Salles */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 style={{ width: "17px", height: "17px", color: "#B91C2F" }} />
            Salles et espaces ({rooms.length}), {roomsAvailable} disponibles
          </h2>
          <PrimaryButton onClick={openAddRoom}><Plus style={{ width: "15px", height: "15px" }} />Ajouter une salle</PrimaryButton>
        </div>

        {rooms.length === 0 ? (
          <Panel><EmptyState icon={<Building2 style={{ width: "24px", height: "24px" }} />} message="Aucune salle enregistree pour le moment." action={<PrimaryButton onClick={openAddRoom}><Plus style={{ width: "15px", height: "15px" }} />Ajouter une salle</PrimaryButton>} /></Panel>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "14px" }}>
            {rooms.map((room) => (
              <div key={room.id} className="lift" style={{ background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #2d2d2d 100%)", color: "white", padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 800, fontSize: "18px", lineHeight: 1.1 }}>{room.code}</p>
                      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginTop: "2px" }}>{room.name}</p>
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px", background: room.isAvailable ? "rgba(34,197,94,0.9)" : "rgba(239,68,68,0.9)", color: "white", whiteSpace: "nowrap" }}>
                      {room.isAvailable ? "Disponible" : "Indisponible"}
                    </span>
                  </div>
                </div>
                <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Capacite</span>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{room.capacity} places</span>
                  </div>
                  {room.building && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Batiment</span>
                      <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>{room.building}{room.floor ? `, ${room.floor}` : ""}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {room.hasProjector && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: "20px" }}>
                        <Projector style={{ width: "12px", height: "12px" }} />Projecteur
                      </span>
                    )}
                    {room.hasComputers && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#7c3aed", background: "#f5f3ff", padding: "3px 8px", borderRadius: "20px" }}>
                        <Monitor style={{ width: "12px", height: "12px" }} />Ordinateurs
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", borderTop: "1px solid var(--border-muted)", paddingTop: "10px" }}>
                    <span>{room._count.schedules} cours planifies</span>
                    <span>{room._count.equipment} equip.</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => openEditRoom(room)} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: "12px", fontWeight: 600, padding: "7px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer" }}>
                      <Pencil style={{ width: "12px", height: "12px" }} />Modifier
                    </button>
                    <button onClick={() => handleDeleteRoom(room)} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: "12px", fontWeight: 600, padding: "7px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "#dc2626", cursor: "pointer" }}>
                      <Trash2 style={{ width: "12px", height: "12px" }} />Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipements */}
      <Panel
        title={`Inventaire des equipements (${equipment.length})`}
        icon={<Monitor style={{ width: "15px", height: "15px", color: "#B91C2F" }} />}
        action={<PrimaryButton onClick={openAddEq}><Plus style={{ width: "15px", height: "15px" }} />Ajouter un equipement</PrimaryButton>}
      >
        {equipment.length === 0 ? (
          <EmptyState icon={<Monitor style={{ width: "24px", height: "24px" }} />} message="Aucun equipement enregistre." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-muted)" }}>
                  <th style={th}>Code</th>
                  <th style={th}>Equipement</th>
                  <th style={th}>Categorie</th>
                  <th style={th}>Salle</th>
                  <th style={th}>Statut</th>
                  <th style={th}>Prochain entretien</th>
                  <th style={{ ...th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((eq, i) => {
                  const overdue = eq.nextMaintenanceDate && new Date(eq.nextMaintenanceDate) < now;
                  return (
                    <tr key={eq.id} className="row-hover" style={{ borderBottom: i < equipment.length - 1 ? "1px solid var(--border-muted)" : "none", background: overdue ? "var(--red-bg)" : "transparent" }}>
                      <td style={{ ...td, fontFamily: "monospace", fontSize: "11px", color: "var(--text-muted)" }}>{eq.code}</td>
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: "var(--text)" }}>{eq.name}</div>
                        {eq.brand && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{eq.brand}</div>}
                      </td>
                      <td style={td}>
                        <span style={{ fontSize: "11px", background: "var(--bg-muted)", color: "var(--text-secondary)", padding: "2px 8px", borderRadius: "20px" }}>{eq.category}</span>
                      </td>
                      <td style={{ ...td, color: "var(--text-secondary)" }}>{eq.room?.name ?? <span style={{ color: "var(--text-muted)" }}>,</span>}</td>
                      <td style={td}><StatusBadge label={getStatusLabel(eq.status)} color={getStatusHex(eq.status)} /></td>
                      <td style={td}>
                        <span style={{ fontSize: "12px", color: overdue ? "#d97706" : "var(--text-muted)", fontWeight: overdue ? 600 : 400 }}>
                          {eq.nextMaintenanceDate ? formatDate(eq.nextMaintenanceDate) : ","}{overdue && " !"}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button onClick={() => openEditEq(eq)} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer" }}>Modifier</button>
                          <button onClick={() => handleDeleteEq(eq)} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "#dc2626", cursor: "pointer" }}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowRoomModal(false)}>
          <div style={{ background: "var(--bg-card)", borderRadius: "16px", boxShadow: "0 24px 80px rgba(0,0,0,0.3)", width: "100%", maxWidth: "32rem", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", marginBottom: "20px" }}>{editingRoom ? "Modifier la salle" : "Ajouter une salle"}</h2>
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
                  <input type="checkbox" checked={roomForm.hasProjector} onChange={(e) => setRoomForm((f) => ({ ...f, hasProjector: e.target.checked }))} className="accent-[#B91C2F]" />
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Projecteur</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={roomForm.hasComputers} onChange={(e) => setRoomForm((f) => ({ ...f, hasComputers: e.target.checked }))} className="accent-[#B91C2F]" />
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Ordinateurs</span>
                </label>
              </div>
              {roomError && <p style={{ fontSize: "13px", color: "#dc2626" }}>{roomError}</p>}
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
          <div style={{ background: "var(--bg-card)", borderRadius: "16px", boxShadow: "0 24px 80px rgba(0,0,0,0.3)", width: "100%", maxWidth: "32rem", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", marginBottom: "20px" }}>{editingEq ? "Modifier l'equipement" : "Ajouter un equipement"}</h2>
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
                  <Label htmlFor="eq-price">Prix d&apos;achat (FCFA)</Label>
                  <Input id="eq-price" type="number" min={0} value={eqForm.purchasePrice} onChange={(e) => setEqForm((f) => ({ ...f, purchasePrice: e.target.value }))} placeholder="250000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eq-room">Salle</Label>
                  <Select id="eq-room" value={eqForm.roomId} onChange={(e) => setEqForm((f) => ({ ...f, roomId: e.target.value }))}>
                    <option value="">Aucune salle</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.code}, {r.name}</option>
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
              {eqError && <p style={{ fontSize: "13px", color: "#dc2626" }}>{eqError}</p>}
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
