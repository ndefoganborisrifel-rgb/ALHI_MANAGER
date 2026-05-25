"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ReceiptData {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  description: string;
  type: string;
  status: string;
  student: { firstName: string; lastName: string; matricule: string; filiere: { name: string; code: string } };
}

const typeLabels: Record<string, string> = {
  INSCRIPTION: "Frais d'inscription",
  TRANCHE1: "1ère tranche de scolarité",
  TRANCHE2: "2ème tranche de scolarité",
  TRANCHE3: "3ème tranche de scolarité",
  TRANCHE4: "4ème tranche de scolarité",
  AUTRE: "Autre versement",
};

const methodLabels: Record<string, string> = {
  ESPECES: "Espèces",
  VIREMENT: "Virement bancaire",
  ORANGE_MONEY: "Orange Money",
  MTN_MOMO: "MTN MoMo",
  CHEQUE: "Chèque",
};

function amountInWords(n: number): string {
  if (n === 0) return "zéro franc CFA";
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

  function twoDigits(n: number): string {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (t === 7) return "soixante-" + (u === 0 ? "dix" : teens[u]);
    if (t === 9) return "quatre-vingt-" + (u === 0 ? "" : teens[u - 10] || units[u]);
    return tens[t] + (u > 0 ? "-" + units[u] : (t === 8 ? "s" : ""));
  }

  function threeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const r = n % 100;
    let result = h > 1 ? units[h] + " cent" : h === 1 ? "cent" : "";
    if (h > 1 && r === 0) result += "s";
    if (r > 0) result += (result ? " " : "") + twoDigits(r);
    return result;
  }

  let result = "";
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const remainder = n % 1000;

  if (millions > 0) result += threeDigits(millions) + " million" + (millions > 1 ? "s" : "");
  if (thousands > 0) result += (result ? " " : "") + (thousands === 1 ? "mille" : threeDigits(thousands) + " mille");
  if (remainder > 0) result += (result ? " " : "") + threeDigits(remainder);

  return result.trim() + " francs CFA";
}

export default function PrintReceiptPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pdf/receipt/${params.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Erreur de chargement"));
  }, [params.id]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return <div className="p-8 text-gray-500">Chargement du reçu...</div>;

  const dateStr = new Date(data.paymentDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <style>{`
        @media print { .no-print { display: none !important; } body { margin: 0; } .page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; } }
        body { background: #f0f0f0; font-family: Arial, sans-serif; }
        .page { background: white; max-width: 148mm; margin: 20px auto; padding: 16mm 14mm; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc; font-size: 13px; }
        .field:last-child { border-bottom: none; }
      `}</style>

      <div className="no-print" style={{ display: "flex", justifyContent: "center", gap: "12px", padding: "16px", background: "#f0f0f0" }}>
        <button onClick={() => window.print()} style={{ background: "#B91C2F", color: "white", border: "none", padding: "10px 28px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
          🖨️ Imprimer le reçu
        </button>
      </div>

      <div className="page">
        {/* Header */}
        <div style={{ textAlign: "center", borderBottom: "3px solid #B91C2F", paddingBottom: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <div style={{ width: "50px", height: "50px", background: "#B91C2F", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "14px", flexShrink: 0 }}>ALI</div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "bold", color: "#1A1A1A" }}>AFRICA LEADERSHIP HIGHER INSTITUTE</div>
              <div style={{ fontSize: "11px", color: "#666" }}>Château Ngoa Ekélé — Yaoundé, Cameroun</div>
            </div>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#B91C2F", marginTop: "12px", letterSpacing: "2px" }}>REÇU DE PAIEMENT</div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>N° <strong>{data.receiptNumber}</strong></div>
        </div>

        {/* Student info */}
        <div style={{ background: "#f8f8f8", borderRadius: "6px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
          <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "6px" }}>{data.student.lastName} {data.student.firstName}</div>
          <div style={{ color: "#555" }}>Matricule : <strong>{data.student.matricule}</strong></div>
          <div style={{ color: "#555" }}>Filière : <strong>{data.student.filiere.name}</strong></div>
        </div>

        {/* Payment details */}
        <div style={{ marginBottom: "16px" }}>
          <div className="field"><span style={{ color: "#555" }}>Date du paiement</span><strong>{dateStr}</strong></div>
          <div className="field"><span style={{ color: "#555" }}>Type de paiement</span><strong>{typeLabels[data.type] ?? data.description}</strong></div>
          <div className="field"><span style={{ color: "#555" }}>Mode de paiement</span><strong>{methodLabels[data.paymentMethod] ?? data.paymentMethod}</strong></div>
          <div className="field"><span style={{ color: "#555" }}>Statut</span><strong style={{ color: "#166534" }}>✓ Validé</strong></div>
        </div>

        {/* Amount */}
        <div style={{ border: "2px solid #1A1A1A", borderRadius: "8px", padding: "16px", textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Montant reçu</div>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#1A1A1A", margin: "8px 0" }}>
            {new Intl.NumberFormat("fr-FR").format(data.amount)} FCFA
          </div>
          <div style={{ fontSize: "12px", color: "#555", fontStyle: "italic" }}>({amountInWords(data.amount)})</div>
        </div>

        {/* Signatures */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "32px", fontSize: "12px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #333", paddingTop: "8px", marginTop: "40px" }}>Le Caissier</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #333", paddingTop: "8px", marginTop: "40px" }}>L&apos;Étudiant(e)</div>
          </div>
        </div>
      </div>
    </>
  );
}
