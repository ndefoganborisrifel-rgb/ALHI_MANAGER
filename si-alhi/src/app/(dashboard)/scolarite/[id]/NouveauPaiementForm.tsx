"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { formatCFA } from "@/lib/utils";

interface Props {
  studentId: string;
  studentName: string;
  balance: number;
}

export function NouveauPaiementForm({ studentId, studentName, balance }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("ESPECES");
  const [type, setType] = useState("TRANCHE1");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, amount: parseInt(amount), paymentMethod: method, type, academicYear: "2025-2026" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setAmount("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-[#B91C2F]/20">
      <CardHeader><CardTitle className="text-[#B91C2F]">Enregistrer un versement</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">Solde restant : <span className="font-bold text-red-600">{formatCFA(Math.max(0, balance))}</span></p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Montant versé (FCFA) *</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 350000"
              min="1000"
              max={balance > 0 ? balance : undefined}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Mode de paiement</Label>
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="ESPECES">Espèces</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="MTN_MOMO">MTN MoMo</option>
              <option value="VIREMENT">Virement bancaire</option>
              <option value="CHEQUE">Chèque</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type de versement</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="INSCRIPTION">Frais d&apos;inscription</option>
              <option value="TRANCHE1">1ère tranche</option>
              <option value="TRANCHE2">2ème tranche</option>
              <option value="TRANCHE3">3ème tranche</option>
              <option value="AUTRE">Autre</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : <><Plus className="w-4 h-4 mr-2" />Enregistrer le versement</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
