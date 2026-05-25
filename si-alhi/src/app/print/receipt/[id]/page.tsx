"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ReceiptData {
  receiptNumber: string;
  date: string;
  paymentDate: string;
  paymentMethod: string;
  type: string;
  status: string;
  academicYear: string;
  description: string | null;
  studentName: string;
  matricule: string;
  filiere: string;
  level: number;
  totalAmount: number;
  amount: number;
  balance: number;
  amountInWords: string;
}

const typeLabels: Record<string, { fr: string; en: string }> = {
  INSCRIPTION: { fr: "Frais d'inscription", en: "Registration fees" },
  TRANCHE1: { fr: "1re tranche de scolarité", en: "1st tuition instalment" },
  TRANCHE2: { fr: "2e tranche de scolarité", en: "2nd tuition instalment" },
  TRANCHE3: { fr: "3e tranche de scolarité", en: "3rd tuition instalment" },
  TRANCHE4: { fr: "4e tranche de scolarité", en: "4th tuition instalment" },
  AUTRE: { fr: "Autre versement", en: "Other payment" },
};

const methodLabels: Record<string, string> = {
  ESPECES: "Espèces / Cash",
  VIREMENT: "Virement bancaire / Bank transfer",
  ORANGE_MONEY: "Orange Money",
  MTN_MOMO: "MTN MoMo",
  CHEQUE: "Chèque / Cheque",
};

function fmtCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ReceiptCopy({ data, copyLabel }: { data: ReceiptData; copyLabel: string }) {
  const typeInfo = typeLabels[data.type] ?? { fr: data.description ?? "Versement", en: "Payment" };
  const methodLabel = methodLabels[data.paymentMethod] ?? data.paymentMethod;
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="copy">
      {/* Watermark */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-30deg)",
          fontSize: "60px",
          fontWeight: "900",
          color: "rgba(185,28,47,0.04)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "4px",
        }}
      >
        ALHI
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "3px solid #B91C2F", paddingBottom: "10px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "#B91C2F",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "900",
                fontSize: "13px",
                letterSpacing: "0.5px",
                flexShrink: 0,
              }}
            >
              ALI
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "bold", color: "#1A1A1A", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Africa Leadership Higher Institute
              </div>
              <div style={{ fontSize: "9px", color: "#666", marginTop: "1px" }}>
                Château Ngoa Ekélé, Yaoundé, Cameroun
              </div>
              <div style={{ fontSize: "9px", color: "#666" }}>
                Tél. +237 657 75 54 87
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "15px", fontWeight: "bold", color: "#B91C2F", letterSpacing: "2px", textTransform: "uppercase" }}>
              Reçu / Receipt
            </div>
            <div style={{ fontSize: "9px", color: "#555", marginTop: "2px" }}>
              N. <strong style={{ color: "#1A1A1A" }}>{data.receiptNumber}</strong>
            </div>
            <div style={{ fontSize: "9px", color: "#555" }}>
              Année / Year: <strong style={{ color: "#1A1A1A" }}>{data.academicYear}</strong>
            </div>
            <div
              style={{
                marginTop: "4px",
                fontSize: "8px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "4px",
                padding: "2px 6px",
                color: "#64748b",
                fontStyle: "italic",
              }}
            >
              {copyLabel}
            </div>
          </div>
        </div>

        {/* Student block */}
        <div
          style={{
            background: "#fafafa",
            borderLeft: "3px solid #B91C2F",
            borderRadius: "0 5px 5px 0",
            padding: "8px 10px",
            marginBottom: "10px",
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: "12px", color: "#1A1A1A" }}>{data.studentName}</div>
          <div style={{ fontSize: "9px", color: "#555", marginTop: "2px" }}>
            Matr. <span style={{ fontFamily: "monospace", color: "#1A1A1A", fontWeight: "bold" }}>{data.matricule}</span>
            {" "}
            Filière: <strong>{data.filiere}</strong>
            {" "}
            Niv. {data.level}
          </div>
        </div>

        {/* Payment details table */}
        <div style={{ marginBottom: "10px" }}>
          <Row label="Date du paiement / Payment date" value={fmtDate(data.paymentDate)} />
          <Row label="Nature / Nature" value={`${typeInfo.fr} / ${typeInfo.en}`} />
          <Row label="Mode / Method" value={methodLabel} />
          <Row label="Statut / Status" value="Validé / Validated" valueStyle={{ color: "#15803d", fontWeight: "bold" }} />
        </div>

        {/* Amount box */}
        <div
          style={{
            border: "2px solid #1A1A1A",
            borderRadius: "6px",
            padding: "10px 14px",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "4px" }}>
            Montant reçu / Amount received
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1A1A1A", letterSpacing: "0.5px" }}>
            {fmtCFA(data.amount)}
          </div>
          <div style={{ fontSize: "9px", color: "#666", fontStyle: "italic", marginTop: "4px" }}>
            ({data.amountInWords})
          </div>
        </div>

        {/* Balance row */}
        {data.totalAmount > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 10px",
              background: data.balance === 0 ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${data.balance === 0 ? "#86efac" : "#fca5a5"}`,
              borderRadius: "5px",
              marginBottom: "14px",
              fontSize: "10px",
            }}
          >
            <span style={{ color: "#555" }}>Solde restant / Remaining balance</span>
            <strong style={{ color: data.balance === 0 ? "#15803d" : "#b91c1c" }}>
              {data.balance === 0 ? "Soldé / Settled" : fmtCFA(data.balance)}
            </strong>
          </div>
        )}

        {/* Signatures */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <SigLine label="Le Caissier / Cashier" />
          <SigLine label="L'Étudiant(e) / Student" />
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "10px",
            textAlign: "center",
            fontSize: "7.5px",
            color: "#bbb",
            borderTop: "1px solid #eee",
            paddingTop: "6px",
          }}
        >
          Yaoundé, le {today}.
          Ce reçu est un document officiel. Toute falsification est passible de poursuites judiciaires.
          / This receipt is an official document. Any forgery is subject to legal prosecution.
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 0",
        borderBottom: "1px dashed #e5e7eb",
        fontSize: "9.5px",
      }}
    >
      <span style={{ color: "#666" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#1A1A1A", textAlign: "right", ...valueStyle }}>{value}</span>
    </div>
  );
}

function SigLine({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center", paddingTop: "6px", marginTop: "30px", borderTop: "1px solid #555", fontSize: "9px", color: "#333" }}>
      {label}
    </div>
  );
}

export default function PrintReceiptPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pdf/receipt/${params.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Erreur de chargement du reçu"));
  }, [params.id]);

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif", color: "#B91C2F" }}>
        <h2>Erreur</h2>
        <p style={{ marginTop: "8px", color: "#555" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif", color: "#888" }}>
        Chargement du reçu...
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
          .page {
            box-shadow: none !important;
            margin: 0 !important;
            width: 210mm !important;
            max-width: 210mm !important;
            padding: 0 !important;
          }
          .cut-line { page-break-inside: avoid; }
        }
        body {
          background: #e5e5e5;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          color: #1A1A1A;
        }
        .page {
          background: white;
          width: 210mm;
          max-width: 210mm;
          margin: 20px auto;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
        }
        .copy {
          position: relative;
          overflow: hidden;
          padding: 12mm 14mm;
          min-height: 140mm;
        }
        .cut-line {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 10mm;
          color: #aaa;
          font-size: 9px;
          font-family: sans-serif;
          letter-spacing: 1px;
        }
        .cut-line::before, .cut-line::after {
          content: "";
          flex: 1;
          border-top: 1px dashed #bbb;
        }
      `}</style>

      {/* Toolbar */}
      <div
        className="no-print"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#1A1A1A",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontFamily: "sans-serif",
        }}
      >
        <span style={{ color: "#aaa", fontSize: "13px" }}>
          Reçu N. {data.receiptNumber} , {data.studentName}
        </span>
        <button
          onClick={() => window.print()}
          style={{
            marginLeft: "auto",
            background: "#B91C2F",
            color: "white",
            border: "none",
            padding: "8px 24px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          Imprimer / Print
        </button>
      </div>

      {/* A4 page with 2 copies */}
      <div className="page">
        <ReceiptCopy data={data} copyLabel="Exemplaire etudiant / Student copy" />
        <div className="cut-line">DECOUPER ICI / CUT HERE</div>
        <ReceiptCopy data={data} copyLabel="Exemplaire etablissement / School copy" />
      </div>
    </>
  );
}
