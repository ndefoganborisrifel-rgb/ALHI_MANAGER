"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, User, GraduationCap, CreditCard, Phone, Mail,
  MapPin, AlertTriangle, FileText, Edit2, CheckCircle
} from "lucide-react";

interface StudentDetail {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  placeOfBirth: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  status: string;
  level: number;
  promotionYear: number;
  createdAt: string;
  filiere: { id: string; name: string; code: string; totalFees: number; specializations: { id: string; name: string }[] };
  specialization: { id: string; name: string } | null;
  parent: { firstName: string; lastName: string; phone: string | null; email: string | null; relation: string } | null;
  payments: { id: string; amount: number; paymentDate: string; type: string; status: string; receiptNumber: string }[];
  grades: { id: string; noteFinal: number | null; course: { name: string; code: string; credits: number } }[];
  attendances: { status: string }[];
}

const statusFlow = [
  { key: "PROSPECT", label: "Prospect", color: "bg-gray-100 text-gray-700" },
  { key: "DOSSIER_RECU", label: "Dossier reçu", color: "bg-orange-100 text-orange-700" },
  { key: "ENTRETIEN", label: "Entretien", color: "bg-yellow-100 text-yellow-700" },
  { key: "ACCEPTE", label: "Accepté", color: "bg-blue-100 text-blue-700" },
  { key: "INSCRIT", label: "Inscrit", color: "bg-indigo-100 text-indigo-700" },
  { key: "ACTIF", label: "Actif", color: "bg-green-100 text-green-700" },
];

const statusExtra = [
  { key: "SUSPENDU", label: "Suspendu", color: "bg-red-100 text-red-700" },
  { key: "DIPLOME", label: "Diplômé", color: "bg-purple-100 text-purple-700" },
];

const allStatuses = [...statusFlow, ...statusExtra];

const typeLabels: Record<string, string> = {
  INSCRIPTION: "Inscription",
  TRANCHE1: "Tranche 1",
  TRANCHE2: "Tranche 2",
  TRANCHE3: "Tranche 3",
  TRANCHE4: "Tranche 4",
  AUTRE: "Autre",
};

const relationLabels: Record<string, string> = {
  PERE: "Père",
  MERE: "Mère",
  TUTEUR: "Tuteur",
};

function fmtCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function fmtDate(d: string | null) {
  if (!d) return "Non renseigné";
  return new Date(d).toLocaleDateString("fr-FR");
}

export default function AdmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState<{
    firstName?: string; lastName?: string; phone?: string | null; email?: string | null;
    city?: string | null; address?: string | null; placeOfBirth?: string | null;
    emergencyContact?: string | null; emergencyPhone?: string | null; specializationId?: string | null;
  }>({});

  useEffect(() => {
    fetch(`/api/students/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setStudent(d);
          setEditFields({
            firstName: d.firstName,
            lastName: d.lastName,
            phone: d.phone,
            email: d.email,
            city: d.city,
            address: d.address,
            placeOfBirth: d.placeOfBirth,
            emergencyContact: d.emergencyContact,
            emergencyPhone: d.emergencyPhone,
            specializationId: d.specialization?.id ?? null,
          });
        }
      })
      .catch(() => setError("Erreur de chargement"));
  }, [params.id]);

  async function changeStatus(newStatus: string) {
    if (!student) return;
    setSavingStatus(true);
    const res = await fetch(`/api/students/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    setSavingStatus(false);
    if (!data.error) setStudent((prev) => prev ? { ...prev, status: newStatus } : prev);
  }

  async function saveEdit() {
    if (!student) return;
    setSavingStatus(true);
    const res = await fetch(`/api/students/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editFields),
    });
    const data = await res.json();
    setSavingStatus(false);
    if (!data.error) {
      setStudent((prev) => prev ? { ...prev, ...editFields } : prev);
      setEditMode(false);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-gray-700 font-medium">{error}</p>
        <Link href="/admission" className="mt-4">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>
        </Link>
      </div>
    );
  }

  if (!student) {
    return <div className="flex items-center justify-center py-24 text-gray-500">Chargement...</div>;
  }

  const totalPaid = student.payments.filter(p => p.status === "VALIDE").reduce((s, p) => s + p.amount, 0);
  const balance = student.filiere.totalFees - totalPaid;
  const pct = student.filiere.totalFees > 0 ? Math.min(100, Math.round((totalPaid / student.filiere.totalFees) * 100)) : 0;
  const currentStatusData = allStatuses.find((s) => s.key === student.status);
  const absences = student.attendances.filter((a) => a.status === "ABSENT").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
          <Link href="/admission" style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
            <ArrowLeft style={{ width: "14px", height: "14px" }} />Retour
          </Link>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User style={{ width: "22px", height: "22px", color: "#B91C2F" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px" }}>{student.lastName} {student.firstName}</h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "monospace" }}>{student.matricule}</p>
          </div>
        </div>
        <Badge className={currentStatusData?.color ?? "bg-gray-100 text-gray-700"}>
          {currentStatusData?.label ?? student.status}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditMode(!editMode)}
        >
          <Edit2 className="w-4 h-4 mr-1" />
          {editMode ? "Annuler" : "Modifier"}
        </Button>
        <Link href={`/print/receipt/${student.payments[0]?.id ?? ""}`} target="_blank">
          <Button size="sm" variant="outline">
            <FileText className="w-4 h-4 mr-1" />Reçu
          </Button>
        </Link>
        <Link href={`/print/bulletin/${student.id}?semester=1&year=2025-2026`} target="_blank">
          <Button size="sm" className="bg-[#B91C2F] text-white hover:bg-[#B91C2F]/90">
            <FileText className="w-4 h-4 mr-1" />Bulletin
          </Button>
        </Link>
      </div>

      {/* Status pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">Pipeline d&apos;admission</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {statusFlow.map((s, i) => {
              const isCurrent = s.key === student.status;
              const isPast = statusFlow.findIndex((x) => x.key === student.status) > i;
              return (
                <button
                  key={s.key}
                  disabled={savingStatus}
                  onClick={() => changeStatus(s.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isCurrent
                      ? "bg-[#B91C2F] text-white border-[#B91C2F]"
                      : isPast
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {isPast && <CheckCircle className="inline w-3 h-3 mr-1" />}
                  {s.label}
                </button>
              );
            })}
            <div className="w-px bg-gray-200 mx-1" />
            {statusExtra.map((s) => (
              <button
                key={s.key}
                disabled={savingStatus}
                onClick={() => changeStatus(s.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  s.key === student.status
                    ? s.key === "SUSPENDU" ? "bg-red-500 text-white border-red-500" : "bg-purple-500 text-white border-purple-500"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#B91C2F]" />
                Informations personnelles
              </CardTitle>
              {editMode && (
                <Button size="sm" onClick={saveEdit} disabled={savingStatus} className="bg-[#B91C2F] text-white">
                  <CheckCircle className="w-4 h-4 mr-1" />Sauvegarder
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "firstName", label: "Prénom" },
                    { key: "lastName", label: "Nom" },
                    { key: "phone", label: "Téléphone" },
                    { key: "email", label: "Email" },
                    { key: "city", label: "Ville" },
                    { key: "address", label: "Adresse" },
                    { key: "placeOfBirth", label: "Lieu de naissance" },
                    { key: "emergencyContact", label: "Contact urgence" },
                    { key: "emergencyPhone", label: "Tel. urgence" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                      <input
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30"
                        value={(editFields as Record<string, string | null>)[key] ?? ""}
                        onChange={(e) => setEditFields((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  {student.filiere.specializations.length > 0 && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Spécialisation</label>
                      <select
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30"
                        value={editFields.specializationId ?? ""}
                        onChange={(e) => setEditFields((prev) => ({ ...prev, specializationId: e.target.value || null }))}
                      >
                        <option value="">Aucune</option>
                        {student.filiere.specializations.map((sp) => (
                          <option key={sp.id} value={sp.id}>{sp.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                  <InfoRow label="Prénom" value={student.firstName} />
                  <InfoRow label="Nom" value={student.lastName} />
                  <InfoRow label="Date de naissance" value={fmtDate(student.dateOfBirth)} />
                  <InfoRow label="Genre" value={student.gender ?? "Non renseigné"} />
                  <InfoRow label="Téléphone" value={student.phone ?? "Non renseigné"} icon={<Phone className="w-3.5 h-3.5 text-gray-400" />} />
                  <InfoRow label="Email" value={student.email ?? "Non renseigné"} icon={<Mail className="w-3.5 h-3.5 text-gray-400" />} />
                  <InfoRow label="Ville" value={student.city ?? "Non renseigné"} icon={<MapPin className="w-3.5 h-3.5 text-gray-400" />} />
                  <InfoRow label="Adresse" value={student.address ?? "Non renseigné"} />
                  <InfoRow label="Lieu de naissance" value={student.placeOfBirth ?? "Non renseigné"} />
                  <InfoRow label="Contact urgence" value={student.emergencyContact ?? "Non renseigné"} />
                  <InfoRow label="Tel. urgence" value={student.emergencyPhone ?? "Non renseigné"} />
                  <InfoRow label="Inscrit le" value={fmtDate(student.createdAt)} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#B91C2F]" />
                Paiements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total scolarité</p>
                  <p className="font-bold text-blue-700">{fmtCFA(student.filiere.totalFees)}</p>
                </div>
                <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Versé ({pct}%)</p>
                  <p className="font-bold text-green-700">{fmtCFA(totalPaid)}</p>
                </div>
                <div className={`flex-1 rounded-lg p-3 text-center ${balance > 0 ? "bg-red-50" : "bg-green-50"}`}>
                  <p className="text-xs text-gray-500 mb-1">Solde restant</p>
                  <p className={`font-bold ${balance > 0 ? "text-red-700" : "text-green-700"}`}>
                    {balance <= 0 ? "Soldé" : fmtCFA(balance)}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full mb-4">
                <div
                  className={`h-full rounded-full ${pct === 100 ? "bg-green-500" : "bg-[#B91C2F]"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {student.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reçu</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{fmtDate(p.paymentDate)}</TableCell>
                        <TableCell><Badge className="bg-blue-50 text-blue-700">{typeLabels[p.type] ?? p.type}</Badge></TableCell>
                        <TableCell className="font-mono text-xs text-gray-500">{p.receiptNumber}</TableCell>
                        <TableCell className="text-right font-semibold">{fmtCFA(p.amount)}</TableCell>
                        <TableCell>
                          <Link href={`/print/receipt/${p.id}`} target="_blank" className="text-xs text-[#B91C2F] hover:underline">
                            Imprimer
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500 text-sm py-4">Aucun paiement enregistré</p>
              )}
            </CardContent>
          </Card>

          {/* Grades */}
          {student.grades.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#B91C2F]" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Matière</TableHead>
                      <TableHead className="text-center">Note/20</TableHead>
                      <TableHead className="text-center">Crédits</TableHead>
                      <TableHead className="text-center">Résultat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.grades.map((g) => {
                      const passed = g.noteFinal != null && g.noteFinal >= 10;
                      return (
                        <TableRow key={g.id}>
                          <TableCell className="font-mono text-xs text-gray-500">{g.course.code}</TableCell>
                          <TableCell className="text-sm">{g.course.name}</TableCell>
                          <TableCell className="text-center">
                            {g.noteFinal != null ? (
                              <span className={`font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
                                {g.noteFinal.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400">En attente</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm">{g.course.credits}</TableCell>
                          <TableCell className="text-center">
                            {g.noteFinal != null ? (
                              <Badge className={passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                {passed ? "Validé" : "Ajourné"}
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500">En attente</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card className="border-l-4 border-l-[#B91C2F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#B91C2F]" />
                Filière
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-semibold text-gray-900">{student.filiere.name}</p>
              <p className="text-gray-500 font-mono text-xs">{student.filiere.code}</p>
              <p className="text-gray-600">Niveau {student.level}</p>
              {student.specialization && (
                <p className="text-xs text-[#B91C2F] font-medium">Spécialisation : {student.specialization.name}</p>
              )}
              <p className="text-gray-500 text-xs">Promotion {student.promotionYear}</p>
            </CardContent>
          </Card>

          {student.parent && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Parent / Tuteur</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1.5">
                <p className="font-medium">{student.parent.lastName} {student.parent.firstName}</p>
                <p className="text-xs text-gray-500">{relationLabels[student.parent.relation] ?? student.parent.relation}</p>
                {student.parent.phone && (
                  <p className="flex items-center gap-1.5 text-gray-600">
                    <Phone className="w-3.5 h-3.5" />{student.parent.phone}
                  </p>
                )}
                {student.parent.email && (
                  <p className="flex items-center gap-1.5 text-gray-600 text-xs break-all">
                    <Mail className="w-3.5 h-3.5 shrink-0" />{student.parent.email}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Assiduité</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${absences > 3 ? "text-red-500" : absences > 0 ? "text-amber-500" : "text-green-500"}`} />
                <span className={`font-bold ${absences > 3 ? "text-red-600" : absences > 0 ? "text-amber-600" : "text-green-600"}`}>
                  {absences} absence{absences !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">sur {student.attendances.length} séances enregistrées</p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Link href={`/print/bulletin/${student.id}?semester=1&year=2025-2026`} target="_blank">
              <Button className="w-full bg-[#B91C2F] text-white hover:bg-[#B91C2F]/90" size="sm">
                <FileText className="w-4 h-4 mr-2" />Bulletin S1
              </Button>
            </Link>
            <Link href={`/print/bulletin/${student.id}?semester=2&year=2025-2026`} target="_blank">
              <Button className="w-full" variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />Bulletin S2
              </Button>
            </Link>
            <Button
              className="w-full"
              variant="outline"
              size="sm"
              onClick={() => router.push(`/scolarite?student=${student.id}`)}
            >
              <CreditCard className="w-4 h-4 mr-2" />Enregistrer un paiement
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="font-medium text-gray-900 flex items-center gap-1.5">
        {icon}{value}
      </p>
    </div>
  );
}
