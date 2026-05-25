"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  filiere: { name: string };
};

type Internship = {
  id: string;
  studentId: string;
  companyName: string;
  topic?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  defenseDate?: string | null;
  defenseNote?: number | null;
  jury?: string | null;
  student: { firstName: string; lastName: string; filiere: { name: string } };
};

const STATUS_OPTIONS = [
  { value: "EN_RECHERCHE", label: "En recherche" },
  { value: "CONVENTION_SIGNEE", label: "Convention signee" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINE", label: "Termine" },
  { value: "SOUTENU", label: "Soutenu" },
];

const emptyCreateForm = { studentId: "", companyName: "", topic: "", startDate: "", endDate: "" };
const emptyUpdateForm = { status: "EN_COURS", defenseDate: "", defenseNote: "", jury: "" };

export default function StagesPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  // Update modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
  const [updateForm, setUpdateForm] = useState(emptyUpdateForm);
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [internshipsRes, studentsRes] = await Promise.all([
        fetch("/api/internships"),
        fetch("/api/students"),
      ]);
      if (internshipsRes.ok) setInternships(await internshipsRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const statusCounts = {
    EN_RECHERCHE: internships.filter((i) => i.status === "EN_RECHERCHE").length,
    CONVENTION_SIGNEE: internships.filter((i) => i.status === "CONVENTION_SIGNEE").length,
    EN_COURS: internships.filter((i) => i.status === "EN_COURS").length,
    TERMINE: internships.filter((i) => i.status === "TERMINE").length,
    SOUTENU: internships.filter((i) => i.status === "SOUTENU").length,
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError("");
    try {
      const payload: Record<string, unknown> = {
        studentId: createForm.studentId,
        companyName: createForm.companyName.trim(),
        topic: createForm.topic.trim() || undefined,
        startDate: createForm.startDate || undefined,
        endDate: createForm.endDate || undefined,
      };
      const res = await fetch("/api/internships", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error ?? "Erreur."); return; }
      setShowCreateModal(false);
      setCreateForm(emptyCreateForm);
      loadData();
    } finally {
      setCreateSubmitting(false);
    }
  }

  function openUpdate(internship: Internship) {
    setEditingInternship(internship);
    setUpdateForm({
      status: internship.status,
      defenseDate: internship.defenseDate ? new Date(internship.defenseDate).toISOString().split("T")[0] : "",
      defenseNote: internship.defenseNote != null ? String(internship.defenseNote) : "",
      jury: internship.jury ?? "",
    });
    setUpdateError("");
    setShowUpdateModal(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingInternship) return;
    setUpdateSubmitting(true);
    setUpdateError("");
    try {
      const payload: Record<string, unknown> = {
        status: updateForm.status,
        defenseDate: updateForm.defenseDate || null,
        defenseNote: updateForm.defenseNote ? parseFloat(updateForm.defenseNote) : null,
        jury: updateForm.jury.trim() || null,
      };
      const res = await fetch(`/api/internships/${editingInternship.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setUpdateError(data.error ?? "Erreur."); return; }
      setShowUpdateModal(false);
      loadData();
    } finally {
      setUpdateSubmitting(false);
    }
  }

  async function handleDelete(internship: Internship) {
    if (!confirm(`Supprimer le stage de ${internship.student.lastName} chez ${internship.companyName} ?`)) return;
    const res = await fetch(`/api/internships/${internship.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Erreur lors de la suppression.");
      return;
    }
    loadData();
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SI-Stage</h1>
          <p className="text-gray-500 text-sm">Suivi des stages et conventions</p>
        </div>
        <Button className="bg-[#B91C2F] hover:bg-[#9b1727] text-white" onClick={() => { setCreateForm(emptyCreateForm); setCreateError(""); setShowCreateModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />Ajouter un stage
        </Button>
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
                <TableHead>Etudiant</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-sm max-w-48 truncate">{i.topic ?? <span className="text-gray-300 italic">Non defini</span>}</TableCell>
                  <TableCell className="text-sm">
                    {i.startDate && i.endDate ? `${formatDate(i.startDate)} au ${formatDate(i.endDate)}` : <span className="text-gray-300">-</span>}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(i.status)}>{getStatusLabel(i.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => openUpdate(i)}>
                        <Pencil className="w-3 h-3 mr-1" />Mettre a jour
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(i)}>
                        <Trash2 className="w-3 h-3 mr-1" />Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {internships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">Aucun stage enregistre</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">Ajouter un stage</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="s-student">Etudiant</Label>
                <Select id="s-student" value={createForm.studentId} onChange={(e) => setCreateForm((f) => ({ ...f, studentId: e.target.value }))} required>
                  <option value="">Selectionner un etudiant</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.lastName} {s.firstName} - {s.filiere.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="s-company">Entreprise</Label>
                <Input id="s-company" value={createForm.companyName} onChange={(e) => setCreateForm((f) => ({ ...f, companyName: e.target.value }))} required placeholder="Nom de l'entreprise" />
              </div>
              <div>
                <Label htmlFor="s-topic">Sujet</Label>
                <Input id="s-topic" value={createForm.topic} onChange={(e) => setCreateForm((f) => ({ ...f, topic: e.target.value }))} placeholder="Sujet du stage" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="s-start">Date de debut</Label>
                  <Input id="s-start" type="date" value={createForm.startDate} onChange={(e) => setCreateForm((f) => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="s-end">Date de fin</Label>
                  <Input id="s-end" type="date" value={createForm.endDate} onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Annuler</Button>
                <Button type="submit" className="flex-1 bg-[#B91C2F] hover:bg-[#9b1727] text-white" disabled={createSubmitting}>
                  {createSubmitting ? "Enregistrement..." : "Ajouter"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && editingInternship && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowUpdateModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Mettre a jour le stage</h2>
            <p className="text-sm text-gray-500 mb-5">{editingInternship.student.lastName} {editingInternship.student.firstName} chez {editingInternship.companyName}</p>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="u-status">Statut</Label>
                <Select id="u-status" value={updateForm.status} onChange={(e) => setUpdateForm((f) => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="u-defense">Date de soutenance</Label>
                <Input id="u-defense" type="date" value={updateForm.defenseDate} onChange={(e) => setUpdateForm((f) => ({ ...f, defenseDate: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="u-note">Note de soutenance (/20)</Label>
                  <Input id="u-note" type="number" min={0} max={20} step={0.5} value={updateForm.defenseNote} onChange={(e) => setUpdateForm((f) => ({ ...f, defenseNote: e.target.value }))} placeholder="14.5" />
                </div>
                <div>
                  <Label htmlFor="u-jury">Jury</Label>
                  <Input id="u-jury" value={updateForm.jury} onChange={(e) => setUpdateForm((f) => ({ ...f, jury: e.target.value }))} placeholder="Noms des membres du jury" />
                </div>
              </div>
              {updateError && <p className="text-sm text-red-600">{updateError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUpdateModal(false)}>Annuler</Button>
                <Button type="submit" className="flex-1 bg-[#B91C2F] hover:bg-[#9b1727] text-white" disabled={updateSubmitting}>
                  {updateSubmitting ? "Enregistrement..." : "Mettre a jour"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
