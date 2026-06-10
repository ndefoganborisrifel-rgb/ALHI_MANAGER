"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Plus, Users, UserCheck, UserX, Wallet, UserCog, Search } from "lucide-react";
import { PageHeader, StatCard, Panel, PrimaryButton, StatusBadge, EmptyState } from "@/components/ui/PageUI";
import { formatCFA, getStatusLabel, getStatusHex } from "@/lib/utils";
import { useCanManage, useRole } from "@/components/providers/RoleProvider";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  speciality?: string | null;
  type: "PERMANENT" | "VACATAIRE";
  hourlyRate: number;
  user: { email: string; isActive: boolean };
  assignments: { id: string; course: { id: string; name: string; code?: string } }[];
  payments: TeacherPayment[];
};

type Course = {
  id: string;
  code: string;
  name: string;
  filiere?: { code: string; name: string } | null;
};

type TeacherPayment = {
  id: string;
  teacherId: string;
  month: number;
  year: number;
  hoursValidated: number;
  hourlyRate: number;
  totalAmount: number;
  status: "BROUILLON" | "VALIDE" | "PAYE";
  teacher: { firstName: string; lastName: string };
};

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const emptyTeacherForm: { firstName: string; lastName: string; email: string; phone: string; speciality: string; type: "PERMANENT" | "VACATAIRE"; hourlyRate: string; courseIds: string[] } = { firstName: "", lastName: "", email: "", phone: "", speciality: "", type: "VACATAIRE", hourlyRate: "", courseIds: [] };
const emptyPayForm = { teacherId: "", month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), hoursValidated: "" };

const th: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 16px", fontSize: "13px", color: "var(--text)", verticalAlign: "middle" };

export default function RHPage() {
  const canManage = useCanManage();
  const role = useRole();
  const isTeacher = role === "ENSEIGNANT";
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payments, setPayments] = useState<TeacherPayment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"enseignants" | "vacations">("enseignants");
  const [teacherSearch, setTeacherSearch] = useState("");

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState(emptyTeacherForm);
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);
  const [teacherError, setTeacherError] = useState("");

  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState(emptyPayForm);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [teachersRes, paymentsRes, coursesRes] = await Promise.all([
        fetch("/api/teachers"),
        fetch("/api/teacher-payments"),
        fetch("/api/courses"),
      ]);
      if (teachersRes.ok) setTeachers(await teachersRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      if (coursesRes.ok) setCourses(await coursesRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPayments = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const permanents = teachers.filter((t) => t.type === "PERMANENT").length;
  const vacataires = teachers.filter((t) => t.type === "VACATAIRE").length;

  const tq = teacherSearch.trim().toLowerCase();
  const filteredTeachers = teachers.filter((t) => {
    if (!tq) return true;
    return `${t.firstName} ${t.lastName}`.toLowerCase().includes(tq)
      || (t.speciality ?? "").toLowerCase().includes(tq)
      || (t.email ?? t.user.email).toLowerCase().includes(tq);
  });

  function openAddTeacher() {
    setEditingTeacher(null);
    setTeacherForm(emptyTeacherForm);
    setTeacherError("");
    setShowTeacherModal(true);
  }

  function openEditTeacher(t: Teacher) {
    setEditingTeacher(t);
    setTeacherForm({
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email ?? t.user.email,
      phone: t.phone ?? "",
      speciality: t.speciality ?? "",
      type: t.type,
      hourlyRate: String(t.hourlyRate),
      courseIds: t.assignments.map((a) => a.course.id),
    });
    setTeacherError("");
    setShowTeacherModal(true);
  }

  function toggleCourse(courseId: string) {
    setTeacherForm((f) => ({
      ...f,
      courseIds: f.courseIds.includes(courseId)
        ? f.courseIds.filter((c) => c !== courseId)
        : [...f.courseIds, courseId],
    }));
  }

  async function handleDisableTeacher(t: Teacher) {
    if (!confirm(`Désactiver ${t.firstName} ${t.lastName} ?`)) return;
    await fetch(`/api/teachers/${t.id}`, { method: "DELETE" });
    loadData();
  }

  async function handleReactivateTeacher(t: Teacher) {
    if (!confirm(`Réactiver ${t.firstName} ${t.lastName} ?`)) return;
    await fetch(`/api/teachers/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: true }) });
    loadData();
  }

  async function handleTeacherSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTeacherSubmitting(true);
    setTeacherError("");
    try {
      const payload = {
        firstName: teacherForm.firstName.trim(),
        lastName: teacherForm.lastName.trim(),
        email: teacherForm.email.trim(),
        phone: teacherForm.phone.trim() || undefined,
        speciality: teacherForm.speciality.trim() || undefined,
        type: teacherForm.type,
        hourlyRate: parseInt(teacherForm.hourlyRate) || 0,
        courseIds: teacherForm.courseIds,
        academicYear: "2025-2026",
        semester: 1,
      };
      const url = editingTeacher ? `/api/teachers/${editingTeacher.id}` : "/api/teachers";
      const method = editingTeacher ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setTeacherError(data.error ?? "Erreur."); return; }
      setShowTeacherModal(false);
      loadData();
    } finally {
      setTeacherSubmitting(false);
    }
  }

  async function handlePaySubmit(e: React.FormEvent) {
    e.preventDefault();
    setPaySubmitting(true);
    setPayError("");
    try {
      const teacher = teachers.find((t) => t.id === payForm.teacherId);
      const payload = {
        teacherId: payForm.teacherId,
        month: parseInt(payForm.month),
        year: parseInt(payForm.year),
        hoursValidated: parseFloat(payForm.hoursValidated),
        hourlyRate: teacher?.hourlyRate ?? 0,
      };
      const res = await fetch("/api/teacher-payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setPayError(data.error ?? "Erreur."); return; }
      setShowPayModal(false);
      setPayForm(emptyPayForm);
      loadData();
    } finally {
      setPaySubmitting(false);
    }
  }

  async function handlePaymentStatus(payment: TeacherPayment, newStatus: "VALIDE" | "PAYE") {
    await fetch(`/api/teacher-payments/${payment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadData();
  }

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "var(--text-muted)" }}>Chargement...</div>;

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer",
    background: active ? "var(--bg-card)" : "transparent", color: active ? "var(--text)" : "var(--text-muted)",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
  });

  return (
    <div style={{ maxWidth: "1280px" }}>
      <PageHeader
        title="SI-RH et Vacations"
        subtitle="Gestion des formateurs et des vacations"
        backHref="/dashboard"
        icon={<UserCog style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
      />

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${isTeacher ? 3 : 4}, 1fr)`, gap: "14px", marginBottom: "20px" }}>
        <StatCard label="Enseignants" value={teachers.length} icon={<Users style={{ width: "18px", height: "18px", color: "#2563eb" }} />} color="#2563eb" bg="#eff6ff" sub="corps enseignant" />
        <StatCard label="Permanents" value={permanents} icon={<UserCheck style={{ width: "18px", height: "18px", color: "#16a34a" }} />} color="#16a34a" bg="#f0fdf4" sub="contrat fixe" />
        <StatCard label="Vacataires" value={vacataires} icon={<UserX style={{ width: "18px", height: "18px", color: "#7c3aed" }} />} color="#7c3aed" bg="#f5f3ff" sub="payés à l'heure" />
        {!isTeacher && <StatCard label="Total vacations" value={formatCFA(totalPayments)} icon={<Wallet style={{ width: "18px", height: "18px", color: "#B91C2F" }} />} color="#B91C2F" bg="#fef2f2" sub="cumul 2025-2026" />}
      </div>

      <div style={{ display: "flex", gap: "4px", background: "var(--bg-muted)", borderRadius: "10px", padding: "4px", width: "fit-content", marginBottom: "16px" }}>
        <button onClick={() => setActiveTab("enseignants")} style={tabBtn(activeTab === "enseignants")}>Enseignants</button>
        {!isTeacher && <button onClick={() => setActiveTab("vacations")} style={tabBtn(activeTab === "vacations")}>Vacations</button>}
      </div>

      {activeTab === "enseignants" && (
        <Panel
          title="Liste des enseignants"
          icon={<Users style={{ width: "15px", height: "15px", color: "#B91C2F" }} />}
          action={canManage && <PrimaryButton onClick={openAddTeacher}><Plus style={{ width: "15px", height: "15px" }} />Ajouter un enseignant</PrimaryButton>}
        >
          {teachers.length === 0 ? (
            <EmptyState icon={<Users style={{ width: "24px", height: "24px" }} />} message="Aucun enseignant enregistré." action={canManage ? <PrimaryButton onClick={openAddTeacher}><Plus style={{ width: "15px", height: "15px" }} />Ajouter un enseignant</PrimaryButton> : undefined} />
          ) : (
            <>
            <div style={{ position: "relative", marginBottom: "14px", maxWidth: "340px" }}>
              <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Rechercher un enseignant, spécialité..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-muted)" }}>
                    <th style={th}>Enseignant</th>
                    <th style={th}>Spécialité</th>
                    <th style={th}>Type</th>
                    {!isTeacher && <th style={th}>Taux horaire</th>}
                    <th style={th}>Cours assignés</th>
                    <th style={th}>Contact</th>
                    <th style={{ ...th, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length === 0 && (
                    <tr><td colSpan={isTeacher ? 6 : 7} style={{ ...td, textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>Aucun enseignant ne correspond a la recherche.</td></tr>
                  )}
                  {filteredTeachers.map((teacher, i) => (
                    <tr key={teacher.id} className="row-hover" style={{ borderBottom: i < filteredTeachers.length - 1 ? "1px solid var(--border-muted)" : "none", opacity: teacher.user.isActive ? 1 : 0.5 }}>
                      <td style={{ ...td, fontWeight: 600 }}>{teacher.firstName} {teacher.lastName}</td>
                      <td style={{ ...td, color: "var(--text-secondary)" }}>{teacher.speciality ?? <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "11px" }}>Non renseigne</span>}</td>
                      <td style={td}><StatusBadge label={getStatusLabel(teacher.type)} color={getStatusHex(teacher.type)} dot={false} /></td>
                      {!isTeacher && (
                        <td style={td}>
                          {teacher.type === "VACATAIRE" ? <span style={{ fontWeight: 600 }}>{formatCFA(teacher.hourlyRate)}/h</span> : <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "11px" }}>Fixe</span>}
                        </td>
                      )}
                      <td style={td}>
                        {teacher.assignments.length === 0 ? (
                          <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "11px" }}>Aucune</span>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "220px" }}>
                            {teacher.assignments.slice(0, 4).map((a) => (
                              <span key={a.id} style={{ fontSize: "10px", fontWeight: 600, background: "var(--bg-muted)", color: "var(--text-secondary)", borderRadius: "5px", padding: "2px 6px" }}>{a.course.code ?? a.course.name}</span>
                            ))}
                            {teacher.assignments.length > 4 && <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>+{teacher.assignments.length - 4}</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ ...td, color: "var(--text-muted)", fontSize: "12px" }}>{teacher.email ?? teacher.user.email}</td>
                      <td style={{ ...td, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          {canManage && <button onClick={() => openEditTeacher(teacher)} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer" }}>Modifier</button>}
                          {canManage && teacher.user.isActive && <button onClick={() => handleDisableTeacher(teacher)} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "#dc2626", cursor: "pointer" }}>Désactiver</button>}
                          {canManage && !teacher.user.isActive && <button onClick={() => handleReactivateTeacher(teacher)} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "#16a34a", cursor: "pointer" }}>Réactiver</button>}
                          {!canManage && <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>Lecture seule</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </Panel>
      )}

      {activeTab === "vacations" && !isTeacher && (
        <Panel
          title="Fiches de vacation"
          icon={<Wallet style={{ width: "15px", height: "15px", color: "#B91C2F" }} />}
          action={<PrimaryButton onClick={() => { setPayForm(emptyPayForm); setPayError(""); setShowPayModal(true); }}><Plus style={{ width: "15px", height: "15px" }} />Enregistrer heures</PrimaryButton>}
        >
          {payments.length === 0 ? (
            <EmptyState icon={<Wallet style={{ width: "24px", height: "24px" }} />} message="Aucune vacation enregistrée." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-muted)" }}>
                    <th style={th}>Enseignant</th>
                    <th style={th}>Période</th>
                    <th style={th}>Heures validées</th>
                    <th style={th}>Taux horaire</th>
                    <th style={th}>Montant</th>
                    <th style={th}>Statut</th>
                    <th style={{ ...th, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p.id} className="row-hover" style={{ borderBottom: i < payments.length - 1 ? "1px solid var(--border-muted)" : "none" }}>
                      <td style={{ ...td, fontWeight: 600 }}>{p.teacher.firstName} {p.teacher.lastName}</td>
                      <td style={td}>{MONTHS[p.month - 1]} {p.year}</td>
                      <td style={td}>{p.hoursValidated}h</td>
                      <td style={td}>{formatCFA(p.hourlyRate)}/h</td>
                      <td style={{ ...td, fontWeight: 700 }}>{formatCFA(p.totalAmount)}</td>
                      <td style={td}><StatusBadge label={getStatusLabel(p.status)} color={getStatusHex(p.status)} /></td>
                      <td style={{ ...td, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          {p.status === "BROUILLON" && <button onClick={() => handlePaymentStatus(p, "VALIDE")} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "#16a34a", cursor: "pointer" }}>Valider</button>}
                          {p.status === "VALIDE" && <button onClick={() => handlePaymentStatus(p, "PAYE")} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "#2563eb", cursor: "pointer" }}>Marquer payé</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {/* Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowTeacherModal(false)}>
          <div style={{ background: "var(--bg-card)", borderRadius: "16px", boxShadow: "0 24px 80px rgba(0,0,0,0.3)", width: "100%", maxWidth: "32rem", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", marginBottom: "20px" }}>{editingTeacher ? "Modifier l'enseignant" : "Ajouter un enseignant"}</h2>
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="t-firstname">Prénom</Label><Input id="t-firstname" value={teacherForm.firstName} onChange={(e) => setTeacherForm((f) => ({ ...f, firstName: e.target.value }))} required /></div>
                <div><Label htmlFor="t-lastname">Nom</Label><Input id="t-lastname" value={teacherForm.lastName} onChange={(e) => setTeacherForm((f) => ({ ...f, lastName: e.target.value }))} required /></div>
              </div>
              <div><Label htmlFor="t-email">Email</Label><Input id="t-email" type="email" value={teacherForm.email} onChange={(e) => setTeacherForm((f) => ({ ...f, email: e.target.value }))} required disabled={!!editingTeacher} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="t-phone">Téléphone</Label><Input id="t-phone" value={teacherForm.phone} onChange={(e) => setTeacherForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+237 6.." /></div>
                <div><Label htmlFor="t-speciality">Spécialité</Label><Input id="t-speciality" value={teacherForm.speciality} onChange={(e) => setTeacherForm((f) => ({ ...f, speciality: e.target.value }))} placeholder="Mathématiques" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="t-type">Type</Label>
                  <Select id="t-type" value={teacherForm.type} onChange={(e) => setTeacherForm((f) => ({ ...f, type: e.target.value as "PERMANENT" | "VACATAIRE" }))}>
                    <option value="VACATAIRE">Vacataire</option>
                    <option value="PERMANENT">Permanent</option>
                  </Select>
                </div>
                <div><Label htmlFor="t-rate">Taux horaire (FCFA)</Label><Input id="t-rate" type="number" min={0} value={teacherForm.hourlyRate} onChange={(e) => setTeacherForm((f) => ({ ...f, hourlyRate: e.target.value }))} placeholder="5000" /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Matières enseignées</Label>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{teacherForm.courseIds.length} sélectionnée{teacherForm.courseIds.length > 1 ? "s" : ""}</span>
                </div>
                {courses.length === 0 ? (
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", padding: "8px 0" }}>Aucune matière disponible. Créez des matières dans Pédagogie.</p>
                ) : (
                  <div style={{ maxHeight: "11rem", overflowY: "auto", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    {courses.map((c) => {
                      const checked = teacherForm.courseIds.includes(c.id);
                      return (
                        <label key={c.id} className="card-hover" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--border-muted)" }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleCourse(c.id)} className="accent-[#B91C2F] w-4 h-4" />
                          <span style={{ fontSize: "13px", color: "var(--text-secondary)", flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 600 }}>{c.code}</span><span style={{ color: "var(--text-muted)" }}> : {c.name}</span>
                          </span>
                          {c.filiere && <span style={{ fontSize: "10px", color: "var(--text-muted)", flexShrink: 0 }}>{c.filiere.code}</span>}
                        </label>
                      );
                    })}
                  </div>
                )}
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Un enseignant ne peut saisir des notes que pour les matières qui lui sont assignées ici.</p>
              </div>
              {teacherError && <p style={{ fontSize: "13px", color: "#dc2626" }}>{teacherError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowTeacherModal(false)}>Annuler</Button>
                <Button type="submit" className="flex-1 bg-[#B91C2F] hover:bg-[#9b1727] text-white" disabled={teacherSubmitting}>
                  {teacherSubmitting ? "Enregistrement..." : editingTeacher ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPayModal(false)}>
          <div style={{ background: "var(--bg-card)", borderRadius: "16px", boxShadow: "0 24px 80px rgba(0,0,0,0.3)", width: "100%", maxWidth: "28rem", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", marginBottom: "20px" }}>Enregistrer des heures de vacation</h2>
            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <Label htmlFor="pay-teacher">Enseignant</Label>
                <Select id="pay-teacher" value={payForm.teacherId} onChange={(e) => setPayForm((f) => ({ ...f, teacherId: e.target.value }))} required>
                  <option value="">Sélectionner un enseignant</option>
                  {teachers.filter((t) => t.user.isActive).map((t) => (
                    <option key={t.id} value={t.id}>{t.lastName} {t.firstName} ({formatCFA(t.hourlyRate)}/h)</option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pay-month">Mois</Label>
                  <Select id="pay-month" value={payForm.month} onChange={(e) => setPayForm((f) => ({ ...f, month: e.target.value }))}>
                    {MONTHS.map((m, i) => (<option key={i} value={String(i + 1)}>{m}</option>))}
                  </Select>
                </div>
                <div><Label htmlFor="pay-year">Année</Label><Input id="pay-year" type="number" min={2020} max={2030} value={payForm.year} onChange={(e) => setPayForm((f) => ({ ...f, year: e.target.value }))} required /></div>
              </div>
              <div><Label htmlFor="pay-hours">Heures validées</Label><Input id="pay-hours" type="number" min={0} step={0.5} value={payForm.hoursValidated} onChange={(e) => setPayForm((f) => ({ ...f, hoursValidated: e.target.value }))} required placeholder="20" /></div>
              {payError && <p style={{ fontSize: "13px", color: "#dc2626" }}>{payError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPayModal(false)}>Annuler</Button>
                <Button type="submit" className="flex-1 bg-[#B91C2F] hover:bg-[#9b1727] text-white" disabled={paySubmitting}>
                  {paySubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
