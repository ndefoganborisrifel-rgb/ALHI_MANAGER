"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface CourseGrade {
  code: string;
  name: string;
  credits: number;
  cc1: number | null;
  cc2: number | null;
  examScore: number | null;
  noteFinal: number | null;
  validated: boolean;
}

interface UEResult {
  ueCode: string;
  ueName: string;
  courses: CourseGrade[];
  average: number | null;
  totalCredits: number;
  validatedCredits: number;
}

interface BulletinData {
  student: { firstName: string; lastName: string; dateOfBirth: string | null; gender: string | null; matricule: string; level: number; major: string };
  academicYear: string;
  semester: number;
  ueResults: UEResult[];
  generalAverage: number | null;
  totalValidatedCredits: number;
  totalCredits: number;
  mention: string;
  rank: string;
  decision: string;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toFixed(2);
}

export default function PrintBulletinPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [data, setData] = useState<BulletinData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const semester = searchParams.get("semester") ?? "1";
  const year = searchParams.get("year") ?? "2025-2026";

  useEffect(() => {
    fetch(`/api/pdf/bulletin/${params.id}?semester=${semester}&year=${year}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Erreur de chargement"));
  }, [params.id, semester, year]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return <div className="p-8 text-gray-500">Chargement du bulletin...</div>;

  const avg = data.generalAverage;
  const admis = avg != null && avg >= 10;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .page { box-shadow: none !important; margin: 0 !important; }
        }
        body { background: #f0f0f0; font-family: 'Times New Roman', serif; }
        .page { background: white; max-width: 210mm; margin: 20px auto; padding: 20mm 18mm; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #333; padding: 5px 8px; }
        th { background: #1A1A1A; color: white; font-weight: bold; text-align: center; }
        .ue-header td { background: #B91C2F; color: white; font-weight: bold; }
        .validated { color: #166534; font-weight: bold; }
        .failed { color: #991b1b; font-weight: bold; }
      `}</style>

      {/* Bouton impression */}
      <div className="no-print flex justify-center gap-3 py-4 bg-gray-100">
        <button
          onClick={() => window.print()}
          style={{ background: "#B91C2F", color: "white", border: "none", padding: "10px 28px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
        >
          🖨️ Imprimer / Télécharger PDF
        </button>
      </div>

      <div className="page">
        {/* En-tête */}
        <div style={{ textAlign: "center", borderBottom: "3px solid #B91C2F", paddingBottom: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
            <div style={{ width: "64px", height: "64px", background: "#B91C2F", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "18px", flexShrink: 0 }}>ALI</div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1A1A1A", letterSpacing: "1px" }}>AFRICA LEADERSHIP HIGHER INSTITUTE</div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>Château Ngoa Ekélé — Yaoundé, Cameroun | +237 657 75 54 87</div>
            </div>
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#B91C2F", marginTop: "14px", textTransform: "uppercase", letterSpacing: "2px" }}>
            Relevé de Notes Semestriel
          </div>
          <div style={{ fontSize: "13px", color: "#444", marginTop: "4px" }}>
            Semestre {data.semester} — Année Académique {data.academicYear}
          </div>
        </div>

        {/* Infos étudiant */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px", fontSize: "13px" }}>
          <div style={{ border: "1px solid #ccc", borderRadius: "6px", padding: "10px" }}>
            <div><strong>Nom :</strong> {data.student.lastName} {data.student.firstName}</div>
            <div><strong>Matricule :</strong> {data.student.matricule}</div>
            <div><strong>Filière :</strong> {data.student.major}</div>
          </div>
          <div style={{ border: "1px solid #ccc", borderRadius: "6px", padding: "10px" }}>
            <div><strong>Niveau :</strong> Niveau {data.student.level}</div>
            <div><strong>Rang :</strong> {data.rank}</div>
            <div><strong>Date d&apos;édition :</strong> {new Date().toLocaleDateString("fr-FR")}</div>
          </div>
        </div>

        {/* Table des notes */}
        <table>
          <thead>
            <tr>
              <th style={{ width: "8%", textAlign: "left" }}>Code</th>
              <th style={{ textAlign: "left" }}>Matière</th>
              <th style={{ width: "6%" }}>Crédits</th>
              <th style={{ width: "7%" }}>CC1</th>
              <th style={{ width: "7%" }}>CC2</th>
              <th style={{ width: "8%" }}>Examen</th>
              <th style={{ width: "8%" }}>Note/20</th>
              <th style={{ width: "10%" }}>Résultat</th>
            </tr>
          </thead>
          <tbody>
            {data.ueResults.map((ue) => (
              <>
                <tr key={ue.ueCode} className="ue-header">
                  <td colSpan={2} style={{ background: "#B91C2F", color: "white", fontWeight: "bold", border: "1px solid #333" }}>
                    {ue.ueCode} — {ue.ueName}
                  </td>
                  <td style={{ background: "#B91C2F", color: "white", textAlign: "center", border: "1px solid #333" }}>{ue.totalCredits}</td>
                  <td colSpan={3} style={{ background: "#B91C2F", border: "1px solid #333" }}></td>
                  <td style={{ background: "#B91C2F", color: "white", textAlign: "center", fontWeight: "bold", border: "1px solid #333" }}>
                    {ue.average != null ? ue.average.toFixed(2) : "—"}
                  </td>
                  <td style={{ background: "#B91C2F", color: "white", textAlign: "center", border: "1px solid #333" }}>
                    {ue.validatedCredits}/{ue.totalCredits} crédits
                  </td>
                </tr>
                {ue.courses.map((c) => (
                  <tr key={c.code} style={{ background: "white" }}>
                    <td style={{ fontFamily: "monospace", fontSize: "11px" }}>{c.code}</td>
                    <td>{c.name}</td>
                    <td style={{ textAlign: "center" }}>{c.credits}</td>
                    <td style={{ textAlign: "center" }}>{fmt(c.cc1)}</td>
                    <td style={{ textAlign: "center" }}>{fmt(c.cc2)}</td>
                    <td style={{ textAlign: "center" }}>{fmt(c.examScore)}</td>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      <span className={c.noteFinal != null && c.noteFinal >= 10 ? "validated" : "failed"}>
                        {fmt(c.noteFinal)}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={c.validated ? "validated" : "failed"}>
                        {c.validated ? "Validé ✓" : "Ajourné ✗"}
                      </span>
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>

        {/* Récapitulatif */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "20px" }}>
          <div style={{ border: "2px solid #1A1A1A", borderRadius: "8px", padding: "14px" }}>
            <div style={{ fontSize: "13px", marginBottom: "8px" }}><strong>Crédits validés :</strong> {data.totalValidatedCredits} / {data.totalCredits}</div>
            <div style={{ fontSize: "13px", marginBottom: "8px" }}><strong>Mention :</strong> {data.mention}</div>
            <div style={{ fontSize: "13px" }}><strong>Classement :</strong> {data.rank}</div>
          </div>
          <div style={{ border: `3px solid ${admis ? "#166534" : "#991b1b"}`, borderRadius: "8px", padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: admis ? "#166534" : "#991b1b" }}>
              {avg != null ? avg.toFixed(2) : "—"}/20
            </div>
            <div style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}>Moyenne Générale</div>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: admis ? "#166534" : "#991b1b", marginTop: "8px" }}>
              {data.decision}
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "40px", fontSize: "12px" }}>
          {["Le Directeur Pédagogique", "Le Responsable de Filière", "Le Secrétariat"].map((s) => (
            <div key={s} style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #333", paddingTop: "8px", marginTop: "40px" }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
