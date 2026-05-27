"use client";
import React, { useEffect, useState } from "react";
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
  student: {
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    gender: string | null;
    matricule: string;
    level: number;
    major: string;
  };
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
  if (n == null) return "n/a";
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
      .catch(() => setError("Erreur de chargement du bulletin"));
  }, [params.id, semester, year]);

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2 style={{ color: "#B91C2F" }}>Erreur</h2>
        <p style={{ color: "#555", marginTop: "8px" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif", color: "#888" }}>
        Chargement du bulletin en cours…
      </div>
    );
  }

  const avg = data.generalAverage;
  const admis = avg != null && avg >= 10;

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
          .page { box-shadow: none !important; margin: 0 !important; padding: 12mm 14mm !important; }
        }
        body {
          background: #e8e8e8;
          font-family: "Times New Roman", Times, serif;
          font-size: 12px;
          color: #1A1A1A;
        }
        .page {
          background: white;
          max-width: 210mm;
          margin: 20px auto;
          padding: 18mm 16mm;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 0;
        }
        th {
          background: #1A1A1A;
          color: white;
          font-weight: bold;
          padding: 6px 7px;
          text-align: center;
          border: 1px solid #1A1A1A;
        }
        th.left { text-align: left; }
        td {
          border: 1px solid #bbb;
          padding: 4px 7px;
          text-align: center;
          vertical-align: middle;
        }
        td.left { text-align: left; }
        td.mono { font-family: monospace; font-size: 10px; color: #555; }
        .ue-header td {
          background: #B91C2F;
          color: white;
          font-weight: bold;
          border-color: #9B1826;
        }
        tr:nth-child(even) td { background: #fafafa; }
        .ue-header td { background: #B91C2F !important; }
        .validated { color: #15803d; font-weight: bold; }
        .failed { color: #b91c1c; font-weight: bold; }
        .neutral { color: #888; }
      `}</style>

      {/* Print toolbar */}
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
          Bulletin de notes : {data.student.lastName} {data.student.firstName}
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
            fontFamily: "sans-serif",
          }}
        >
          Imprimer / PDF
        </button>
      </div>

      <div className="page">
        {/* School header */}
        <div
          style={{
            textAlign: "center",
            borderBottom: "3px double #B91C2F",
            paddingBottom: "14px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="ALHI"
              style={{ width: "64px", height: "64px", flexShrink: 0 }}
            />
            <div>
              <div
                style={{
                  fontSize: "17px",
                  fontWeight: "bold",
                  color: "#1A1A1A",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Africa Leadership Higher Institute
              </div>
              <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                Château Ngoa Ekélé, Yaoundé, Cameroun, Tél. : +237 657 75 54 87
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#B91C2F",
              marginTop: "12px",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Relevé de Notes Semestriel
          </div>
          <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>
            Semestre {data.semester}, Année Académique {data.academicYear}
          </div>
        </div>

        {/* Student info box */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "16px",
            fontSize: "12px",
          }}
        >
          <div style={{ border: "1.5px solid #B91C2F", borderRadius: "5px", padding: "10px 12px" }}>
            <div style={{ marginBottom: "5px" }}>
              <strong>Nom &amp; Prénom :</strong>{" "}
              {data.student.lastName} {data.student.firstName}
            </div>
            <div style={{ marginBottom: "5px" }}>
              <strong>Matricule :</strong>{" "}
              <span style={{ fontFamily: "monospace" }}>{data.student.matricule}</span>
            </div>
            <div>
              <strong>Filière :</strong> {data.student.major}
            </div>
          </div>
          <div style={{ border: "1.5px solid #ccc", borderRadius: "5px", padding: "10px 12px" }}>
            <div style={{ marginBottom: "5px" }}>
              <strong>Niveau :</strong> {data.student.level}
            </div>
            <div style={{ marginBottom: "5px" }}>
              <strong>Classement :</strong> {data.rank}
            </div>
            <div>
              <strong>Date d&apos;édition :</strong>{" "}
              {new Date().toLocaleDateString("fr-FR")}
            </div>
          </div>
        </div>

        {/* Grade table */}
        <table>
          <thead>
            <tr>
              <th className="left" style={{ width: "8%" }}>Code</th>
              <th className="left">Matière</th>
              <th style={{ width: "6%" }}>Crédits</th>
              <th style={{ width: "7%" }}>CC1</th>
              <th style={{ width: "7%" }}>CC2</th>
              <th style={{ width: "8%" }}>Examen</th>
              <th style={{ width: "9%" }}>Note/20</th>
              <th style={{ width: "10%" }}>Résultat</th>
            </tr>
          </thead>
          <tbody>
            {data.ueResults.map((ue) => (
              <React.Fragment key={`ue-${ue.ueCode}`}>
                <tr className="ue-header">
                  <td className="left" colSpan={2}>
                    <strong>{ue.ueCode}</strong> : {ue.ueName}
                  </td>
                  <td>{ue.totalCredits}</td>
                  <td colSpan={3}></td>
                  <td>
                    <strong>
                      {ue.average != null ? ue.average.toFixed(2) : "n/a"}
                    </strong>
                  </td>
                  <td>
                    {ue.validatedCredits}/{ue.totalCredits} crd.
                  </td>
                </tr>
                {ue.courses.map((c) => (
                  <tr key={c.code}>
                    <td className="mono">{c.code}</td>
                    <td className="left">{c.name}</td>
                    <td>{c.credits}</td>
                    <td>{fmt(c.cc1)}</td>
                    <td>{fmt(c.cc2)}</td>
                    <td>{fmt(c.examScore)}</td>
                    <td>
                      <span
                        className={
                          c.noteFinal == null
                            ? "neutral"
                            : c.noteFinal >= 10
                            ? "validated"
                            : "failed"
                        }
                      >
                        {fmt(c.noteFinal)}
                      </span>
                    </td>
                    <td>
                      <span className={c.noteFinal == null ? "neutral" : c.validated ? "validated" : "failed"}>
                        {c.noteFinal == null ? "n/a" : c.validated ? "Validé" : "Ajourné"}
                      </span>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
            marginTop: "18px",
          }}
        >
          <div
            style={{
              border: "1.5px solid #1A1A1A",
              borderRadius: "6px",
              padding: "12px 14px",
              fontSize: "12px",
            }}
          >
            <div style={{ marginBottom: "7px" }}>
              <strong>Crédits validés :</strong> {data.totalValidatedCredits} / {data.totalCredits}
            </div>
            <div style={{ marginBottom: "7px" }}>
              <strong>Mention :</strong>{" "}
              <span style={{ color: admis ? "#15803d" : "#b91c1c", fontWeight: "bold" }}>
                {data.mention}
              </span>
            </div>
            <div>
              <strong>Classement :</strong> {data.rank}
            </div>
          </div>

          <div
            style={{
              border: `2.5px solid ${admis ? "#15803d" : "#b91c1c"}`,
              borderRadius: "6px",
              padding: "12px 14px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "30px",
                fontWeight: "bold",
                color: admis ? "#15803d" : "#b91c1c",
              }}
            >
              {avg != null ? avg.toFixed(2) : "n/a"}/20
            </div>
            <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>
              Moyenne Générale
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: admis ? "#15803d" : "#b91c1c",
                marginTop: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {data.decision}
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "20px",
            marginTop: "44px",
            fontSize: "11px",
            textAlign: "center",
          }}
        >
          {["Le Directeur Pédagogique", "Le Responsable de Filière", "Le Secrétariat Académique"].map((label) => (
            <div key={label}>
              <div
                style={{
                  borderTop: "1px solid #555",
                  paddingTop: "6px",
                  marginTop: "40px",
                  color: "#333",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "18px",
            textAlign: "center",
            fontSize: "9.5px",
            color: "#999",
            borderTop: "1px solid #ddd",
            paddingTop: "8px",
          }}
        >
          Africa Leadership Higher Institute, Château Ngoa Ekélé, Yaoundé, Cameroun<br />
          Ce document est un relevé officiel de notes. Toute falsification est passible de sanctions disciplinaires et pénales.
        </div>
      </div>
    </>
  );
}
