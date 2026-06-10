"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Eye, EyeOff, Copy, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageUI";

const ROLES = [
  { value: "ADMIN", label: "Administrateur", desc: "Accès complet au système" },
  { value: "SCOLARITE", label: "Service Scolarité", desc: "Paiements, inscriptions, dossiers" },
  { value: "ENSEIGNANT", label: "Enseignant", desc: "Cours, notes, présences" },
  { value: "ETUDIANT", label: "Étudiant", desc: "Portail étudiant, bulletins, emploi du temps" },
  { value: "PARENT", label: "Parent / Tuteur", desc: "Suivi et résultats de l'élève" },
];

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

interface StudentOption {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  filiere: { name: string; code: string };
}

interface FiliereOption {
  id: string;
  code: string;
  name: string;
}

export default function NouveauUtilisateurPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    role: "ENSEIGNANT", password: generatePassword(),
    speciality: "", teacherType: "VACATAIRE", hourlyRate: "",
    existingStudentId: "", newStudentFiliereCode: "",
    parentRelation: "TUTEUR", parentProfession: "", linkStudentId: "",
  });
  const [studentMode, setStudentMode] = useState<"existing" | "new">("existing");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [filieres, setFilieres] = useState<FiliereOption[]>([]);
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/filieres").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setFilieres(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.role === "ETUDIANT" || form.role === "PARENT") {
      fetch("/api/students?noAccount=true").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setStudents(data);
      }).catch(() => {});
    }
  }, [form.role]);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function copyPassword() {
    navigator.clipboard.writeText(form.password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.role === "ETUDIANT" && studentMode === "existing" && !form.existingStudentId) {
      setError("Veuillez sélectionner un étudiant existant.");
      return;
    }
    if (form.role === "ETUDIANT" && studentMode === "new" && !form.newStudentFiliereCode) {
      setError("Veuillez sélectionner une filière.");
      return;
    }

    setLoading(true);
    const payload: Record<string, unknown> = {
      firstName: form.firstName, lastName: form.lastName,
      email: form.email, phone: form.phone,
      role: form.role, tempPassword: form.password,
    };

    if (form.role === "ENSEIGNANT") {
      payload.speciality = form.speciality;
      payload.teacherType = form.teacherType;
      if (form.hourlyRate) payload.hourlyRate = parseInt(form.hourlyRate);
    }
    if (form.role === "ETUDIANT") {
      if (studentMode === "existing") payload.existingStudentId = form.existingStudentId;
      else payload.newStudentFiliereCode = form.newStudentFiliereCode;
    }
    if (form.role === "PARENT") {
      payload.parentRelation = form.parentRelation;
      payload.parentProfession = form.parentProfession;
      if (form.linkStudentId) payload.linkStudentId = form.linkStudentId;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/users"), 2000);
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  const needsExtras = ["ENSEIGNANT", "ETUDIANT", "PARENT"].includes(form.role);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Nouveau compte utilisateur"
        subtitle="Créer un accès à l'application"
        backHref="/users"
        icon={<UserPlus style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
      />

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-700">
          <CheckCircle className="w-5 h-5" />
          Compte créé avec succès. Redirection en cours...
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#B91C2F]" />
              Informations du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Base fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input required value={form.firstName} onChange={e => set("firstName", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]"
                  placeholder="Jean" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input required value={form.lastName} onChange={e => set("lastName", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]"
                  placeholder="DUPONT" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email *</label>
              <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]"
                placeholder="jean.dupont@alhi.cm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]"
                placeholder="+237 6XX XX XX XX" />
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rôle *</label>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => set("role", r.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      form.role === r.value
                        ? "border-[#B91C2F] bg-[#B91C2F]/5"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      form.role === r.value ? "border-[#B91C2F] bg-[#B91C2F]" : "border-gray-300"
                    }`}>
                      {form.role === r.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${form.role === r.value ? "text-[#B91C2F]" : "text-gray-700"}`}>
                        {r.label}
                      </div>
                      <div className="text-xs text-gray-400">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Role-specific extra fields */}
            {needsExtras && (
              <div className="border border-dashed border-blue-200 rounded-lg p-4 bg-blue-50/40 space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  {form.role === "ENSEIGNANT" && "Profil enseignant"}
                  {form.role === "ETUDIANT" && "Profil étudiant"}
                  {form.role === "PARENT" && "Profil parent ou tuteur"}
                </p>

                {form.role === "ENSEIGNANT" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Spécialité</label>
                        <input value={form.speciality} onChange={e => set("speciality", e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Informatique, Gestion..." />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type de contrat</label>
                        <select value={form.teacherType} onChange={e => set("teacherType", e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                          <option value="VACATAIRE">Vacataire</option>
                          <option value="PERMANENT">Permanent</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Taux horaire (XAF / heure)</label>
                      <input type="number" min="0" value={form.hourlyRate} onChange={e => set("hourlyRate", e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="ex: 5000" />
                    </div>
                  </>
                )}

                {form.role === "ETUDIANT" && (
                  <>
                    <div className="flex gap-2">
                      {(["existing", "new"] as const).map(m => (
                        <button key={m} type="button" onClick={() => setStudentMode(m)}
                          className={`flex-1 text-xs py-2 px-3 rounded-lg border font-medium transition-all ${
                            studentMode === m
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          {m === "existing" ? "Lier un étudiant existant" : "Nouveau profil étudiant"}
                        </button>
                      ))}
                    </div>

                    {studentMode === "existing" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sélectionner l&apos;étudiant *</label>
                        <select value={form.existingStudentId} onChange={e => set("existingStudentId", e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                          <option value="">-- Choisir un étudiant --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.matricule} - {s.lastName} {s.firstName} ({s.filiere?.code})
                            </option>
                          ))}
                        </select>
                        {students.length === 0 && (
                          <p className="text-xs text-gray-400 mt-1">Aucun étudiant sans compte trouvé. Utilisez &quot;Nouveau profil&quot; ou passez d&apos;abord par Admission.</p>
                        )}
                      </div>
                    )}

                    {studentMode === "new" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Filière *</label>
                        <select value={form.newStudentFiliereCode} onChange={e => set("newStudentFiliereCode", e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                          <option value="">-- Choisir une filière --</option>
                          {filieres.map(f => (
                            <option key={f.code} value={f.code}>{f.name} ({f.code})</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Le matricule sera généré automatiquement. Le prénom et nom saisis ci-dessus seront utilisés.</p>
                      </div>
                    )}
                  </>
                )}

                {form.role === "PARENT" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Relation</label>
                        <select value={form.parentRelation} onChange={e => set("parentRelation", e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                          <option value="PERE">Père</option>
                          <option value="MERE">Mère</option>
                          <option value="TUTEUR">Tuteur / Tutrice</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Profession</label>
                        <input value={form.parentProfession} onChange={e => set("parentProfession", e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Ingénieur, Médecin..." />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Étudiant lié (optionnel)</label>
                      <select value={form.linkStudentId} onChange={e => set("linkStudentId", e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                        <option value="">-- Aucun lien pour l&apos;instant --</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.matricule} - {s.lastName} {s.firstName} ({s.filiere?.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe initial</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type={showPwd ? "text" : "password"} value={form.password}
                    onChange={e => set("password", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={copyPassword}>
                  {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => set("password", generatePassword())}>
                  Générer
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                L&apos;utilisateur devra changer ce mot de passe lors de sa première connexion.
              </p>
            </div>

            <div className="pt-4 border-t flex justify-end gap-3">
              <Link href="/users">
                <Button type="button" variant="outline">Annuler</Button>
              </Link>
              <Button type="submit" disabled={loading || success}
                className="bg-[#B91C2F] text-white hover:bg-[#B91C2F]/90">
                {loading ? "Création..." : "Créer le compte"}
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}
