"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface CourseCol {
  id: string;
  code: string;
  name: string;
  credits: number;
  ueCode: string;
}

interface StudentRow {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  notes: Record<string, number | null>;
  average: number | null;
  mention: string;
  validatedCredits: number;
  decision: string;
  rank: number;
}

interface PvData {
  filiere: { code: string; name: string };
  session: string;
  academicYear: string;
  semester: number;
  courses: CourseCol[];
  totalCredits: number;
  students: StudentRow[];
  stats: { total: number; admis: number; ajourne: number };
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "-";
  return n.toFixed(2);
}

export default function PrintPvFilierePage() {
  const params = useParams<{ filiereId: string }>();
  const searchParams = useSearchParams();
  const [data, setData] = useState<PvData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const session = searchParams.get("session") === "RATTRAPAGE" ? "RATTRAPAGE" : "NORMALE";
  const year = searchParams.get("year") ?? "2025-2026";
  const semester = searchParams.get("semester") ?? "1";

  useEffect(() => {
    fetch(`/api/examens/pv-filiere?filiereId=${params.filiereId}&session=${session}&year=${year}&semester=${semester}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Erreur de chargement du PV"));
  }, [params.filiereId, session, year, semester]);

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2 style={{ color: "#B91C2F" }}>Document indisponible</h2>
        <p style={{ color: "#555", marginTop: "8px" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif", color: "#888" }}>
        Chargement du PV en cours...
      </div>
    );
  }

  const sessionLabel = data.session === "RATTRAPAGE" ? "Rattrapage" : "Normale";
  const dateEdition = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const reussite = data.stats.total > 0 ? Math.round((data.stats.admis / data.stats.total) * 100) : 0;

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
          .page { box-shadow: none !important; margin: 0 !important; padding: 8mm 8mm !important; }
          @page { size: A4 landscape; margin: 6mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          th { background: #1A1A1A !important; color: white !important; }
        }
        body {
          background: #d8d8d8;
          font-family: "Times New Roman", Times, serif;
          font-size: 10px;
          color: #1A1A1A;
        }
        .page {
          background: white;
          width: 297mm;
          max-width: 100%;
          margin: 16px auto;
          padding: 10mm 10mm;
          box-shadow: 0 6px 32px rgba(0,0,0,0.22);
        }
        table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
        th {
          background: #1A1A1A;
          color: white;
          font-weight: bold;
          padding: 3px 3px;
          text-align: center;
          border: 1px solid #1A1A1A;
          font-size: 7.5px;
        }
        th.left { text-align: left; }
        td { border: 1px solid #ccc; padding: 2px 3px; text-align: center; vertical-align: middle; }
        td.left { text-align: left; }
        td.mono { font-family: monospace; font-size: 7.5px; color: #555; }
        tr:nth-child(even) td { background: #fafafa; }
        .ok { color: #15803d; font-weight: bold; }
        .ko { color: #b91c1c; font-weight: bold; }
        .na { color: #bbb; }
        .vcode { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; }
      `}</style>

      {/* Barre d'impression */}
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 100, background: "#1A1A1A", padding: "9px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: "#aaa", fontFamily: "sans-serif", fontSize: "12px" }}>
          PV {sessionLabel} : {data.filiere.name} | S{data.semester} | {data.academicYear}
        </span>
        <button onClick={() => window.print()} style={{ marginLeft: "auto", background: "#B91C2F", color: "white", border: "none", padding: "7px 22px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", fontFamily: "sans-serif" }}>
          Imprimer / PDF
        </button>
        <button onClick={() => window.close()} style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontFamily: "sans-serif" }}>
          Fermer
        </button>
      </div>

      <div className="page">
        {/* En-tete */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", borderBottom: "3px double #B91C2F", paddingBottom: "10px", marginBottom: "10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ALHI" style={{ width: "56px", height: "56px", flexShrink: 0, objectFit: "contain" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "15px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Africa Leadership Higher Institute
            </div>
            <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>
              Château Ngoa Ekélé, Yaoundé, Cameroun. Tel. : +237 657 75 54 87
            </div>
            <div style={{ fontSize: "13px", fontWeight: "bold", color: "#B91C2F", marginTop: "6px", textTransform: "uppercase", letterSpacing: "1.5px" }}>
              Procès-Verbal de Notes, Session {sessionLabel}
            </div>
          </div>
        </div>

        {/* Bandeau infos */}
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px", fontSize: "10px" }}>
          <span><strong>Filière :</strong> {data.filiere.name} ({data.filiere.code})</span>
          <span><strong>Semestre :</strong> S{data.semester}</span>
          <span><strong>Année :</strong> {data.academicYear}</span>
          <span><strong>Effectif :</strong> {data.stats.total} étudiant{data.stats.total > 1 ? "s" : ""}</span>
          <span><strong>Date :</strong> {dateEdition}</span>
        </div>

        {/* Tableau */}
        <table>
          <thead>
            <tr>
              <th style={{ width: "26px" }}>Rang</th>
              <th style={{ width: "78px" }}>Matricule</th>
              <th className="left">Nom et Prénom</th>
              {data.courses.map((c) => (
                <th key={c.id} title={c.name} style={{ minWidth: "24px" }}>{c.code}</th>
              ))}
              <th style={{ width: "40px" }}>Moy./20</th>
              <th style={{ width: "44px" }}>Crd.</th>
              <th style={{ width: "52px" }}>Decision</th>
            </tr>
          </thead>
          <tbody>
            {data.students.length === 0 && (
              <tr>
                <td colSpan={data.courses.length + 6} style={{ padding: "16px", color: "#888", fontStyle: "italic" }}>
                  Aucun étudiant actif dans cette filiere.
                </td>
              </tr>
            )}
            {data.students.sort((a, b) => a.rank - b.rank).map((s) => {
              const admis = s.decision === "Admis";
              return (
                <tr key={s.id}>
                  <td style={{ fontWeight: "bold", color: "#555" }}>{s.rank}</td>
                  <td className="mono">{s.matricule}</td>
                  <td className="left">{s.lastName} {s.firstName}</td>
                  {data.courses.map((c) => {
                    const note = s.notes[c.id];
                    const cls = note == null ? "na" : note >= 14 ? "ok" : "ko";
                    return <td key={c.id} className={cls}>{fmt(note)}</td>;
                  })}
                  <td className={s.average == null ? "na" : admis ? "ok" : "ko"} style={{ fontWeight: "bold" }}>
                    {fmt(s.average)}
                  </td>
                  <td>{s.validatedCredits}/{data.totalCredits}</td>
                  <td className={admis ? "ok" : "ko"}>{s.decision}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Legende des matieres */}
        <div style={{ marginTop: "8px", fontSize: "8px", color: "#555" }}>
          <strong>Matières :</strong>{" "}
          {data.courses.map((c, i) => (
            <span key={c.id}>
              {c.code} = {c.name} ({c.credits} crd.){i < data.courses.length - 1 ? " | " : ""}
            </span>
          ))}
        </div>

        {/* Synthese */}
        <div style={{ marginTop: "10px", display: "flex", gap: "18px", fontSize: "10px", flexWrap: "wrap" }}>
          <span><strong>Admis :</strong> <span style={{ color: "#15803d", fontWeight: "bold" }}>{data.stats.admis}</span></span>
          <span><strong>Ajournés :</strong> <span style={{ color: "#b91c1c", fontWeight: "bold" }}>{data.stats.ajourne}</span></span>
          <span><strong>Taux de réussite :</strong> {reussite}%</span>
          <span style={{ color: "#777" }}>Seuil de validation : 14/20</span>
        </div>

        {/* Signatures */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginTop: "26px", fontSize: "10px", textAlign: "center" }}>
          <div>
            <div style={{ borderTop: "1.5px solid #333", paddingTop: "5px", marginTop: "36px" }}>
              <div style={{ fontWeight: "bold" }}>La DAAC</div>
              <div style={{ fontSize: "8px", color: "#777" }}>Direction des Affaires Académiques et de la Conformité</div>
            </div>
          </div>
          <div>
            <div style={{ borderTop: "1.5px solid #333", paddingTop: "5px", marginTop: "36px" }}>
              <div style={{ fontWeight: "bold" }}>La Directrice de l&apos;Institut</div>
              <div style={{ fontSize: "8px", color: "#777" }}>The Director</div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div style={{ marginTop: "12px", textAlign: "center", fontSize: "8px", color: "#aaa", borderTop: "1px solid #e0e0e0", paddingTop: "6px" }}>
          Africa Leadership Higher Institute, Château Ngoa Ekélé, Yaoundé, Cameroun.
          Ce document est un procès-verbal officiel. Toute falsification est passible de sanctions disciplinaires et pénales.
        </div>
      </div>
    </>
  );
}
