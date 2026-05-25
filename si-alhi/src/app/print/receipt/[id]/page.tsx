"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ReceiptData {
  receiptNumber: string;
  date: string;
  studentName: string;
  matricule: string;
  filiere: string;
  level: number;
  totalAmount: number;
  amount: number;
  balance: number;
  amountInWords: string;
  academicYear: string;
  description: string | null;
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

function fmtCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export default function PrintReceiptPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<{
    type: string;
    paymentMethod: string;
    paymentDate: string;
  } | null>(null);

  useEffect(() => {
    // Fetch both the receipt data (from /api/pdf/receipt) and raw payment info
    fetch(`/api/pdf/receipt/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setData(d);
        }
      })
      .catch(() => setError("Erreur de chargement du reçu"));

    // Also fetch detailed payment for type/method
    fetch(`/api/payments?id=${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error) setPayment(d);
      })
      .catch(() => {
        // Silently fail — the /api/pdf/receipt data is sufficient
      });
  }, [params.id]);

  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          fontFamily: "sans-serif",
          color: "#B91C2F",
        }}
      >
        <h2>Erreur</h2>
        <p style={{ marginTop: "8px", color: "#555" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          fontFamily: "sans-serif",
          color: "#888",
        }}
      >
        Chargement du reçu en cours…
      </div>
    );
  }

  const dateStr = new Date(data.date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const today = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 12mm 14mm !important;
            max-width: 100% !important;
          }
        }
        body {
          background: #e5e5e5;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          color: #1A1A1A;
        }
        .page {
          background: white;
          max-width: 148mm;
          margin: 20px auto;
          padding: 14mm 14mm 18mm 14mm;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
          position: relative;
        }
        .divider { border: none; border-top: 1px dashed #ccc; margin: 10px 0; }
        .field-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 7px 0;
          border-bottom: 1px dashed #e0e0e0;
          font-size: 11.5px;
        }
        .field-row:last-child { border-bottom: none; }
        .field-label { color: #666; }
        .field-value { font-weight: 600; color: #1A1A1A; text-align: right; }
        .sig-line {
          border-top: 1px solid #555;
          padding-top: 6px;
          margin-top: 40px;
          text-align: center;
          font-size: 11px;
          color: #333;
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
        }}
      >
        <span style={{ color: "#aaa", fontFamily: "sans-serif", fontSize: "13px" }}>
          Reçu N° {data.receiptNumber} — {data.studentName}
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
          Imprimer le reçu
        </button>
      </div>

      <div className="page">
        {/* Watermark-style diagonal text for printed receipts */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-35deg)",
            fontSize: "72px",
            fontWeight: "bold",
            color: "rgba(185, 28, 47, 0.04)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 0,
          }}
        >
          ALHI
        </div>

        {/* Content wrapper above watermark */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              borderBottom: "3px solid #B91C2F",
              paddingBottom: "14px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  background: "#B91C2F",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "13px",
                  flexShrink: 0,
                  letterSpacing: "0.5px",
                }}
              >
                ALHI
              </div>
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#1A1A1A",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Africa Leadership Higher Institute
                </div>
                <div style={{ fontSize: "10.5px", color: "#666", marginTop: "2px" }}>
                  Château Ngoa Ekélé, Yaoundé, Cameroun
                </div>
                <div style={{ fontSize: "10.5px", color: "#666" }}>
                  Tél. : +237 657 75 54 87
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#B91C2F",
                letterSpacing: "3px",
                textTransform: "uppercase",
              }}
            >
              Reçu de Paiement
            </div>

            <div
              style={{
                marginTop: "6px",
                display: "flex",
                justifyContent: "center",
                gap: "20px",
                fontSize: "11px",
                color: "#555",
              }}
            >
              <span>
                N° <strong style={{ color: "#1A1A1A" }}>{data.receiptNumber}</strong>
              </span>
              <span>
                Année : <strong style={{ color: "#1A1A1A" }}>{data.academicYear}</strong>
              </span>
            </div>
          </div>

          {/* Student info */}
          <div
            style={{
              background: "#f9f9f9",
              borderRadius: "6px",
              padding: "10px 12px",
              marginBottom: "14px",
              borderLeft: "3px solid #B91C2F",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "13.5px",
                color: "#1A1A1A",
                marginBottom: "5px",
              }}
            >
              {data.studentName}
            </div>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "3px" }}>
              Matricule :{" "}
              <strong style={{ fontFamily: "monospace", color: "#1A1A1A" }}>
                {data.matricule}
              </strong>
            </div>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "3px" }}>
              Filière : <strong style={{ color: "#1A1A1A" }}>{data.filiere}</strong>
            </div>
            <div style={{ fontSize: "11px", color: "#555" }}>
              Niveau : <strong style={{ color: "#1A1A1A" }}>{data.level}</strong>
            </div>
          </div>

          {/* Payment details */}
          <div style={{ marginBottom: "14px" }}>
            <div className="field-row">
              <span className="field-label">Date du paiement</span>
              <span className="field-value">{dateStr}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Type de paiement</span>
              <span className="field-value">
                {data.description ? typeLabels[data.description] ?? data.description : "Versement scolarité"}
              </span>
            </div>
            <div className="field-row">
              <span className="field-label">Mode de paiement</span>
              <span className="field-value">
                {payment?.paymentMethod
                  ? methodLabels[payment.paymentMethod] ?? payment.paymentMethod
                  : "—"}
              </span>
            </div>
            <div className="field-row">
              <span className="field-label">Statut</span>
              <span className="field-value" style={{ color: "#15803d" }}>
                Validé ✓
              </span>
            </div>
          </div>

          {/* Amount box */}
          <div
            style={{
              border: "2px solid #1A1A1A",
              borderRadius: "8px",
              padding: "14px 16px",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                marginBottom: "6px",
              }}
            >
              Montant reçu
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#1A1A1A",
                letterSpacing: "0.5px",
              }}
            >
              {fmtCFA(data.amount)}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#666",
                fontStyle: "italic",
                marginTop: "6px",
              }}
            >
              ({data.amountInWords})
            </div>
          </div>

          {/* Balance */}
          {data.totalAmount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 10px",
                background: data.balance === 0 ? "#f0fdf4" : "#fef2f2",
                borderRadius: "5px",
                fontSize: "11.5px",
                marginBottom: "20px",
                border: `1px solid ${data.balance === 0 ? "#86efac" : "#fca5a5"}`,
              }}
            >
              <span style={{ color: "#555" }}>Solde restant</span>
              <strong
                style={{
                  color: data.balance === 0 ? "#15803d" : "#b91c1c",
                }}
              >
                {data.balance === 0 ? "Soldé ✓" : fmtCFA(data.balance)}
              </strong>
            </div>
          )}

          {/* Signatures */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "30px",
              marginTop: "30px",
            }}
          >
            <div className="sig-line">Le Caissier</div>
            <div className="sig-line">L&apos;Étudiant(e)</div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
              fontSize: "9px",
              color: "#bbb",
              borderTop: "1px solid #eee",
              paddingTop: "8px",
            }}
          >
            Yaoundé, le {today} — Ce reçu est un document officiel. Toute falsification est
            passible de poursuites judiciaires.
          </div>
        </div>
      </div>
    </>
  );
}
