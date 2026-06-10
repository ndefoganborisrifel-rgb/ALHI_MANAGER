"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import { formatDate, getStatusHex, getStatusLabel } from "@/lib/utils";
import { useCanManage } from "@/components/providers/RoleProvider";
import { PageHeader, Panel, PrimaryButton, StatusBadge, EmptyState } from "@/components/ui/PageUI";

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
  { value: "CONVENTION_SIGNEE", label: "Convention signée" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINE", label: "Terminé" },
  { value: "SOUTENU", label: "Soutenu" },
];

const emptyCreateForm = { studentId: "", companyName: "", topic: "", startDate: "", endDate: "" };
const emptyUpdateForm = { status: "EN_COURS", defenseDate: "", defenseNote: "", jury: "" };

const th: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 16px", fontSize: "13px", color: "var(--text)", verticalAlign: "middle" };

export default function StagesPage() {
  const canManage = useCanManage();
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

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "var(--text-muted)" }}>Chargement...</div>;

  const STATUS_TONE: Record<string, string> = { EN_RECHERCHE: "#6b7280", CONVENTION_SIGNEE: "#2563eb", EN_COURS: "#d97706", TERMINE: "#16a34a", SOUTENU: "#7c3aed" };

  return (
    <div style={{ maxWidth: "1200px" }}>
      <PageHeader
        title="SI-Stage"
        subtitle="Suivi des stages et conventions"
        backHref="/dashboard"
        icon={<Briefcase style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
        actions={canManage ? <PrimaryButton onClick={() => { setCreateForm(emptyCreateForm); setCreateError(""); setShowCreateModal(true); }}><Plus style={{ width: "15px", height: "15px" }} />Ajouter un stage</PrimaryButton> : undefined}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {Object.entries(statusCounts).map(([status, count]) => {
          const tone = STATUS_TONE[status] ?? "#6b7280";
          return (
            <div key={status} style={{ background: "var(--bg-card)", borderRadius: "14px", padding: "16px", border: "1px solid var(--border)", textAlign: "center" }}>
              <p style={{ fontSize: "26px", fontWeight: 900, color: tone, lineHeight: 1 }}>{count}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>{getStatusLabel(status)}</p>
            </div>
          );
        })}
      </div>

      <Panel title={`Conventions de stage (${internships.length})`} icon={<Briefcase style={{ width: "15px", height: "15px", color: "#B91C2F" }} />}>
        {internships.length === 0 ? (
          <EmptyState icon={<Briefcase style={{ width: "24px", height: "24px" }} />} message="Aucun stage enregistré." action={canManage ? <PrimaryButton onClick={() => { setCreateForm(emptyCreateForm); setCreateError(""); setShowCreateModal(true); }}><Plus style={{ width: "15px", height: "15px" }} />Ajouter un stage</PrimaryButton> : undefined} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-muted)" }}>
                  <th style={th}>Étudiant</th>
                  <th style={th}>Entreprise</th>
                  <th style={th}>Sujet</th>
                  <th style={th}>Période</th>
                  <th style={th}>Statut</th>
                  <th style={{ ...th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {internships.map((i, idx) => (
                  <tr key={i.id} className="row-hover" style={{ borderBottom: idx < internships.length - 1 ? "1px solid var(--border-muted)" : "none" }}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{i.student.lastName} {i.student.firstName}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{i.student.filiere.name}</div>
                    </td>
                    <td style={{ ...td, fontWeight: 600 }}>{i.companyName}</td>
                    <td style={{ ...td, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.topic ?? <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Non défini</span>}</td>
                    <td style={{ ...td, color: "var(--text-secondary)", fontSize: "12px" }}>{i.startDate && i.endDate ? `${formatDate(i.startDate)} au ${formatDate(i.endDate)}` : <span style={{ color: "var(--text-muted)" }}>,</span>}</td>
                    <td style={td}><StatusBadge label={getStatusLabel(i.status)} color={getStatusHex(i.status)} /></td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        {canManage && <button onClick={() => openUpdate(i)} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer" }}><Pencil style={{ width: "12px", height: "12px" }} />Mettre à jour</button>}
                        {canManage && <button onClick={() => handleDelete(i)} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "#dc2626", cursor: "pointer" }}><Trash2 style={{ width: "12px", height: "12px" }} />Supprimer</button>}
                        {!canManage && <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>Lecture seule</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">Ajouter un stage</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="s-student">Étudiant</Label>
                <Select id="s-student" value={createForm.studentId} onChange={(e) => setCreateForm((f) => ({ ...f, studentId: e.target.value }))} required>
                  <option value="">Sélectionner un étudiant</option>
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
                  <Label htmlFor="s-start">Date de début</Label>
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
            <h2 className="text-lg font-bold text-gray-900 mb-1">Mettre à jour le stage</h2>
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
