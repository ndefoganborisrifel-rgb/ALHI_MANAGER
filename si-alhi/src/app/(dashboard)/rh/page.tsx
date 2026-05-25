"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Plus, Users, UserCheck, UserX, Wallet } from "lucide-react";
import { formatCFA, getStatusLabel, getStatusColor } from "@/lib/utils";

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
  assignments: { id: string; course: { name: string } }[];
  payments: TeacherPayment[];
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

const MONTHS = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];

const emptyTeacherForm: { firstName: string; lastName: string; email: string; phone: string; speciality: string; type: "PERMANENT" | "VACATAIRE"; hourlyRate: string } = { firstName: "", lastName: "", email: "", phone: "", speciality: "", type: "VACATAIRE", hourlyRate: "" };
const emptyPayForm = { teacherId: "", month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), hoursValidated: "" };

export default function RHPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payments, setPayments] = useState<TeacherPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"enseignants" | "vacations">("enseignants");

  // Teacher modal
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState(emptyTeacherForm);
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);
  const [teacherError, setTeacherError] = useState("");

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState(emptyPayForm);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [teachersRes, paymentsRes] = await Promise.all([
        fetch("/api/teachers"),
        fetch("/api/teacher-payments"),
      ]);
      if (teachersRes.ok) setTeachers(await teachersRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPayments = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const permanents = teachers.filter((t) => t.type === "PERMANENT").length;
  const vacataires = teachers.filter((t) => t.type === "VACATAIRE").length;

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
    });
    setTeacherError("");
    setShowTeacherModal(true);
  }

  async function handleDisableTeacher(t: Teacher) {
    if (!confirm(`Desactiver ${t.firstName} ${t.lastName} ?`)) return;
    await fetch(`/api/teachers/${t.id}`, { method: "DELETE" });
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

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SI-RH et Vacations</h1>
        <p className="text-gray-500 text-sm">Gestion des formateurs et des vacations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl"><Users className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
                <p className="text-xs text-gray-500">Enseignants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-50 rounded-xl"><UserCheck className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-green-600">{permanents}</p>
                <p className="text-xs text-gray-500">Permanents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 rounded-xl"><UserX className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{vacataires}</p>
                <p className="text-xs text-gray-500">Vacataires</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-xl"><Wallet className="w-5 h-5 text-[#B91C2F]" /></div>
              <div>
                <p className="text-lg font-bold text-[#B91C2F]">{formatCFA(totalPayments)}</p>
                <p className="text-xs text-gray-500">Total vacations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("enseignants")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "enseignants" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        >
          Enseignants
        </button>
        <button
          onClick={() => setActiveTab("vacations")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "vacations" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        >
          Vacations
        </button>
      </div>

      {activeTab === "enseignants" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Liste des enseignants</CardTitle>
            <Button size="sm" className="bg-[#B91C2F] hover:bg-[#9b1727] text-white" onClick={openAddTeacher}>
              <Plus className="w-4 h-4 mr-1" />Ajouter un enseignant
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Specialite</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Taux horaire</TableHead>
                  <TableHead>Cours assignes</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id} className={!teacher.user.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{teacher.firstName} {teacher.lastName}</TableCell>
                    <TableCell className="text-sm text-gray-600">{teacher.speciality ?? <span className="text-gray-300 text-xs italic">Non renseigne</span>}</TableCell>
                    <TableCell>
                      <Badge className={teacher.type === "PERMANENT" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                        {getStatusLabel(teacher.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {teacher.type === "VACATAIRE" ? (
                        <span className="text-sm font-medium">{formatCFA(teacher.hourlyRate)}/h</span>
                      ) : <span className="text-gray-300 text-xs italic">Fixe</span>}
                    </TableCell>
                    <TableCell>{teacher.assignments.length} cours</TableCell>
                    <TableCell className="text-sm text-gray-500">{teacher.email ?? teacher.user.email}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => openEditTeacher(teacher)}>Modifier</Button>
                        {teacher.user.isActive && (
                          <Button variant="outline" size="sm" className="text-xs h-7 text-red-600 hover:text-red-700" onClick={() => handleDisableTeacher(teacher)}>Desactiver</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "vacations" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fiches de vacation</CardTitle>
            <Button size="sm" className="bg-[#B91C2F] hover:bg-[#9b1727] text-white" onClick={() => { setPayForm(emptyPayForm); setPayError(""); setShowPayModal(true); }}>
              <Plus className="w-4 h-4 mr-1" />Enregistrer heures
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Heures validees</TableHead>
                  <TableHead>Taux horaire</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.teacher.firstName} {p.teacher.lastName}</TableCell>
                    <TableCell className="text-sm">{MONTHS[p.month - 1]} {p.year}</TableCell>
                    <TableCell className="text-sm">{p.hoursValidated}h</TableCell>
                    <TableCell className="text-sm">{formatCFA(p.hourlyRate)}/h</TableCell>
                    <TableCell className="font-semibold">{formatCFA(p.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(p.status)}>{getStatusLabel(p.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {p.status === "BROUILLON" && (
                          <Button variant="outline" size="sm" className="text-xs h-7 text-green-700" onClick={() => handlePaymentStatus(p, "VALIDE")}>Valider</Button>
                        )}
                        {p.status === "VALIDE" && (
                          <Button variant="outline" size="sm" className="text-xs h-7 text-blue-700" onClick={() => handlePaymentStatus(p, "PAYE")}>Marquer paye</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400">Aucune vacation enregistree</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowTeacherModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editingTeacher ? "Modifier l'enseignant" : "Ajouter un enseignant"}</h2>
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="t-firstname">Prenom</Label>
                  <Input id="t-firstname" value={teacherForm.firstName} onChange={(e) => setTeacherForm((f) => ({ ...f, firstName: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="t-lastname">Nom</Label>
                  <Input id="t-lastname" value={teacherForm.lastName} onChange={(e) => setTeacherForm((f) => ({ ...f, lastName: e.target.value }))} required />
                </div>
              </div>
              <div>
                <Label htmlFor="t-email">Email</Label>
                <Input id="t-email" type="email" value={teacherForm.email} onChange={(e) => setTeacherForm((f) => ({ ...f, email: e.target.value }))} required disabled={!!editingTeacher} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="t-phone">Telephone</Label>
                  <Input id="t-phone" value={teacherForm.phone} onChange={(e) => setTeacherForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+225 07..." />
                </div>
                <div>
                  <Label htmlFor="t-speciality">Specialite</Label>
                  <Input id="t-speciality" value={teacherForm.speciality} onChange={(e) => setTeacherForm((f) => ({ ...f, speciality: e.target.value }))} placeholder="Mathematiques" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="t-type">Type</Label>
                  <Select id="t-type" value={teacherForm.type} onChange={(e) => setTeacherForm((f) => ({ ...f, type: e.target.value as "PERMANENT" | "VACATAIRE" }))}>
                    <option value="VACATAIRE">Vacataire</option>
                    <option value="PERMANENT">Permanent</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="t-rate">Taux horaire (FCFA)</Label>
                  <Input id="t-rate" type="number" min={0} value={teacherForm.hourlyRate} onChange={(e) => setTeacherForm((f) => ({ ...f, hourlyRate: e.target.value }))} placeholder="5000" />
                </div>
              </div>
              {teacherError && <p className="text-sm text-red-600">{teacherError}</p>}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">Enregistrer des heures de vacation</h2>
            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <Label htmlFor="pay-teacher">Enseignant</Label>
                <Select id="pay-teacher" value={payForm.teacherId} onChange={(e) => setPayForm((f) => ({ ...f, teacherId: e.target.value }))} required>
                  <option value="">Selectionner un enseignant</option>
                  {teachers.filter((t) => t.user.isActive).map((t) => (
                    <option key={t.id} value={t.id}>{t.lastName} {t.firstName} ({formatCFA(t.hourlyRate)}/h)</option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pay-month">Mois</Label>
                  <Select id="pay-month" value={payForm.month} onChange={(e) => setPayForm((f) => ({ ...f, month: e.target.value }))}>
                    {MONTHS.map((m, i) => (
                      <option key={i} value={String(i + 1)}>{m}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pay-year">Annee</Label>
                  <Input id="pay-year" type="number" min={2020} max={2030} value={payForm.year} onChange={(e) => setPayForm((f) => ({ ...f, year: e.target.value }))} required />
                </div>
              </div>
              <div>
                <Label htmlFor="pay-hours">Heures validees</Label>
                <Input id="pay-hours" type="number" min={0} step={0.5} value={payForm.hoursValidated} onChange={(e) => setPayForm((f) => ({ ...f, hoursValidated: e.target.value }))} required placeholder="20" />
              </div>
              {payError && <p className="text-sm text-red-600">{payError}</p>}
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
