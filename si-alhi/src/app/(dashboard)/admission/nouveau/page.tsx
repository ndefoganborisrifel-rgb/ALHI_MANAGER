"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageUI";

export default function NouvelAdmissionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [filieres, setFilieres] = useState<{ code: string; name: string }[]>([]);
  const [form, setForm] = useState({
    firstName: "", lastName: "", dateOfBirth: "", gender: "M",
    phone: "", email: "", city: "", address: "", placeOfBirth: "",
    filiereCode: "", emergencyContact: "", emergencyPhone: "",
    status: "PROSPECT",
  });

  useEffect(() => {
    fetch("/api/filieres")
      .then((r) => r.json())
      .then((data: { code: string; name: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setFilieres(data);
          setForm((f) => ({ ...f, filiereCode: f.filiereCode || data[0].code }));
        }
      })
      .catch(() => {});
  }, []);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      router.push(`/admission/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Nouveau candidat"
        subtitle={`Etape ${step}/2`}
        backHref="/admission"
        icon={<UserPlus style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
      />

      {/* Steps indicator */}
      <div className="flex gap-2">
        {[1, 2].map((s) => (
          <div key={s} className={`flex-1 h-2 rounded-full ${s <= step ? "bg-[#B91C2F]" : "bg-gray-200"}`} />
        ))}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>{step === 1 ? "Informations personnelles" : "Informations académiques"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom de famille *</Label>
                    <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="NOM" required className="uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label>Prénom(s) *</Label>
                    <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="Prénom" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de naissance</Label>
                    <Input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Select value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+237 6XX XXX XXX" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@exemple.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Yaoundé" />
                  </div>
                  <div className="space-y-2">
                    <Label>Lieu de naissance</Label>
                    <Input value={form.placeOfBirth} onChange={(e) => update("placeOfBirth", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Contact d&apos;urgence</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={form.emergencyContact} onChange={(e) => update("emergencyContact", e.target.value)} placeholder="Nom du contact" />
                    <Input value={form.emergencyPhone} onChange={(e) => update("emergencyPhone", e.target.value)} placeholder="Téléphone" />
                  </div>
                </div>
                <Button type="button" onClick={() => setStep(2)} className="w-full">Suivant →</Button>
              </>
            )}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Filière souhaitée *</Label>
                  <Select value={form.filiereCode} onChange={(e) => update("filiereCode", e.target.value)} required>
                    {filieres.length === 0 && <option value="">Chargement...</option>}
                    {filieres.map((f) => (
                      <option key={f.code} value={f.code}>{f.name} ({f.code})</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut initial</Label>
                  <Select value={form.status} onChange={(e) => update("status", e.target.value)}>
                    <option value="PROSPECT">Prospect</option>
                    <option value="DOSSIER_RECU">Dossier reçu</option>
                    <option value="ENTRETIEN">Entretien planifié</option>
                    <option value="ACCEPTE">Accepté</option>
                    <option value="INSCRIT">Inscrit</option>
                    <option value="ACTIF">Actif</option>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">← Précédent</Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : "Enregistrer le candidat"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
