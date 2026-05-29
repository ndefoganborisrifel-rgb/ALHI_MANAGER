"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Eye, EyeOff, Copy, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageUI";

const ROLES = [
  { value: "ADMIN", label: "Administrateur" },
  { value: "SCOLARITE", label: "Service Scolarité" },
  { value: "ENSEIGNANT", label: "Enseignant" },
  { value: "ETUDIANT", label: "Étudiant" },
  { value: "PARENT", label: "Parent" },
];

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function NouveauUtilisateurPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "ENSEIGNANT",
    password: generatePassword(),
  });
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tempPassword: form.password }),
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Nouveau compte utilisateur"
        subtitle="Creer un acces a l'application"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]"
                  placeholder="DUPONT"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]"
                placeholder="jean.dupont@alhi.cm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]"
                placeholder="+237 6XX XX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
              <select
                required
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F] bg-white"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe initial</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#B91C2F]/30 focus:border-[#B91C2F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
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
              <Button
                type="submit"
                disabled={loading || success}
                className="bg-[#B91C2F] text-white hover:bg-[#B91C2F]/90"
              >
                {loading ? "Création..." : "Créer le compte"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
