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
  if (n == null) return "-";
  return n.toFixed(2);
}

function ProgressChart({ ueResults }: { ueResults: UEResult[] }) {
  const allCourses = ueResults.flatMap((ue) => ue.courses).filter((c) => c.noteFinal != null);
  if (allCourses.length === 0) return null;
  return (
    <div style={{ marginTop: "4px" }}>
      <div style={{ fontSize: "7.5px", fontWeight: "bold", color: "#1A1A1A", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Recapitulatif des notes
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
        {allCourses.map((c) => {
          const score = c.noteFinal ?? 0;
          const ok = score >= 10;
          return (
            <div key={c.code} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 4px", background: ok ? "#f0fdf4" : "#fef2f2", borderRadius: "3px", border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}` }}>
              <span style={{ fontSize: "6.5px", fontFamily: "monospace", color: "#555", flexShrink: 0, minWidth: "40px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.code.slice(-8)}</span>
              <span style={{ fontSize: "8px", fontWeight: "800", color: ok ? "#15803d" : "#b91c1c", marginLeft: "auto" }}>{score.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
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
        <h2 style={{ color: "#B91C2F" }}>Acces refuse ou document indisponible</h2>
        <p style={{ color: "#555", marginTop: "8px" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif", color: "#888" }}>
        Chargement du bulletin en cours...
      </div>
    );
  }

  const avg = data.generalAverage;
  const admis = avg != null && avg >= 10;
  const dateEdition = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; font-size: 9px !important; }
          .page { box-shadow: none !important; margin: 0 !important; padding: 7mm 9mm !important; }
          @page { size: A4 portrait; margin: 6mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .ue-row td { background: #B91C2F !important; color: white !important; }
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
          max-width: 210mm;
          margin: 16px auto;
          padding: 11mm 11mm;
          box-shadow: 0 6px 32px rgba(0,0,0,0.22);
        }
        table { width: 100%; border-collapse: collapse; font-size: 9px; }
        th {
          background: #1A1A1A;
          color: white;
          font-weight: bold;
          padding: 4px 5px;
          text-align: center;
          border: 1px solid #1A1A1A;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        th.left { text-align: left; }
        td { border: 1px solid #ccc; padding: 2px 5px; text-align: center; vertical-align: middle; }
        td.left { text-align: left; }
        td.mono { font-family: monospace; font-size: 8px; color: #555; }
        .ue-row td { background: #B91C2F !important; color: white; font-weight: bold; border-color: #9B1826; }
        tr:nth-child(even) td:not(.ue-row td) { background: #fafafa; }
        .ok { color: #15803d; font-weight: bold; }
        .ko { color: #b91c1c; font-weight: bold; }
        .na { color: #aaa; }
        .sep { height: 4px; }
      `}</style>

      {/* Print toolbar */}
      <div
        className="no-print"
        style={{ position: "sticky", top: 0, zIndex: 100, background: "#1A1A1A", padding: "9px 20px", display: "flex", alignItems: "center", gap: "12px" }}
      >
        <span style={{ color: "#aaa", fontFamily: "sans-serif", fontSize: "12px" }}>
          Bulletin : {data.student.lastName} {data.student.firstName} | S{data.semester} | {data.academicYear}
        </span>
        <button
          onClick={() => window.print()}
          style={{ marginLeft: "auto", background: "#B91C2F", color: "white", border: "none", padding: "7px 22px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", fontFamily: "sans-serif" }}
        >
          Imprimer / PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontFamily: "sans-serif" }}
        >
          Fermer
        </button>
      </div>

      <div className="page">

        {/* ─── EN-TETE OFFICIELLE CAMEROUN 3 COLONNES ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: "8px", paddingBottom: "7px", marginBottom: "6px" }}>

          {/* Colonne gauche : version francaise */}
          <div style={{ textAlign: "center", fontSize: "8.5px", lineHeight: "1.55" }}>
            <div style={{ fontWeight: "900", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.4px" }}>REPUBLIQUE DU CAMEROUN</div>
            <div style={{ fontStyle: "italic", color: "#444" }}>Paix - Travail - Patrie</div>
            <div className="sep" />
            <div style={{ fontWeight: "700", fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.3px" }}>Ministere des Enseignements Superieurs</div>
            <div className="sep" />
            <div style={{ fontWeight: "800", color: "#B91C2F", fontSize: "9px", textTransform: "uppercase" }}>Africa Leadership</div>
            <div style={{ fontWeight: "800", color: "#B91C2F", fontSize: "9px", textTransform: "uppercase" }}>Higher Institute</div>
            <div style={{ color: "#555", fontSize: "7.5px", marginTop: "3px" }}>Chateau Ngoa Ekele, Yaounde, Cameroun</div>
            <div style={{ color: "#555", fontSize: "7.5px" }}>Tel : (+237) 657 75 54 87 / 676 25 85 13</div>
          </div>

          {/* Colonne centre : logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="ALHI"
              style={{ width: "68px", height: "68px", objectFit: "contain" }}
            />
          </div>

          {/* Colonne droite : version anglaise */}
          <div style={{ textAlign: "center", fontSize: "8.5px", lineHeight: "1.55" }}>
            <div style={{ fontWeight: "900", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.4px" }}>REPUBLIC OF CAMEROON</div>
            <div style={{ fontStyle: "italic", color: "#444" }}>Peace - Work - Fatherland</div>
            <div className="sep" />
            <div style={{ fontWeight: "700", fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.3px" }}>Ministry of Higher Education</div>
            <div className="sep" />
            <div style={{ fontWeight: "800", color: "#B91C2F", fontSize: "9px", textTransform: "uppercase" }}>Africa Leadership</div>
            <div style={{ fontWeight: "800", color: "#B91C2F", fontSize: "9px", textTransform: "uppercase" }}>Higher Institute</div>
            <div style={{ color: "#555", fontSize: "7.5px", marginTop: "3px" }}>info@africaleadershipinstitute.com</div>
            <div style={{ color: "#555", fontSize: "7.5px" }}>www.africaleadershipinstitute.com</div>
          </div>
        </div>

        {/* Titre du document */}
        <div style={{ textAlign: "center", marginBottom: "12px", padding: "6px 0", borderBottom: "1px solid #ccc" }}>
          <div style={{ fontSize: "13px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2.5px", color: "#1A1A1A" }}>
            Releve de Notes Semestriel
          </div>
          <div style={{ fontSize: "10px", fontStyle: "italic", color: "#666", marginTop: "2px" }}>
            Transcript / Semestre {data.semester}, Annee Academique {data.academicYear}
          </div>
        </div>

        {/* Infos etudiant */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px", fontSize: "9.5px" }}>
          <div style={{ border: "1.5px solid #B91C2F", borderRadius: "4px", padding: "9px 11px" }}>
            <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
              <span style={{ fontWeight: "bold" }}>Nom(s) et Prenom(s) :</span>
              <span>{data.student.lastName} {data.student.firstName}</span>
            </div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
              <span style={{ fontStyle: "italic", fontSize: "8.5px", color: "#888" }}>Name and surname</span>
            </div>
            {data.student.dateOfBirth && (
              <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
                <span style={{ fontWeight: "bold" }}>Ne(e) le :</span>
                <span>{new Date(data.student.dateOfBirth).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                <span style={{ fontStyle: "italic", fontSize: "8.5px", color: "#888", marginLeft: "4px" }}>Born on</span>
              </div>
            )}
            {data.student.gender && (
              <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
                <span style={{ fontWeight: "bold" }}>Sexe :</span>
                <span>{data.student.gender === "M" ? "Masculin" : "Feminin"}</span>
                <span style={{ fontStyle: "italic", fontSize: "8.5px", color: "#888", marginLeft: "4px" }}>Sex</span>
              </div>
            )}
            <div style={{ display: "flex", gap: "4px" }}>
              <span style={{ fontWeight: "bold" }}>Specialite :</span>
              <span>{data.student.major}</span>
              <span style={{ fontStyle: "italic", fontSize: "8.5px", color: "#888", marginLeft: "4px" }}>Major</span>
            </div>
          </div>
          <div style={{ border: "1.5px solid #ccc", borderRadius: "4px", padding: "9px 11px" }}>
            <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
              <span style={{ fontWeight: "bold" }}>Matricule :</span>
              <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>{data.student.matricule}</span>
              <span style={{ fontStyle: "italic", fontSize: "8.5px", color: "#888", marginLeft: "4px" }}>Id string</span>
            </div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
              <span style={{ fontWeight: "bold" }}>Niveau :</span>
              <span>{data.student.level}</span>
              <span style={{ fontStyle: "italic", fontSize: "8.5px", color: "#888", marginLeft: "4px" }}>Level</span>
            </div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
              <span style={{ fontWeight: "bold" }}>Classement :</span>
              <span>{data.rank}</span>
            </div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
              <span style={{ fontWeight: "bold" }}>Annee Academique :</span>
              <span>{data.academicYear}</span>
              <span style={{ fontStyle: "italic", fontSize: "8.5px", color: "#888", marginLeft: "4px" }}>Academic year</span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <span style={{ fontWeight: "bold" }}>Date d&apos;edition :</span>
              <span>{dateEdition}</span>
            </div>
          </div>
        </div>

        {/* Tableau des notes */}
        <table>
          <thead>
            <tr>
              <th className="left" style={{ width: "8%" }}>Code</th>
              <th className="left">Matiere</th>
              <th style={{ width: "6%" }}>Crd.</th>
              <th style={{ width: "7%" }}>CC1</th>
              <th style={{ width: "7%" }}>CC2</th>
              <th style={{ width: "8%" }}>Examen</th>
              <th style={{ width: "8%" }}>Note/20</th>
              <th style={{ width: "9%" }}>Resultat</th>
            </tr>
          </thead>
          <tbody>
            {data.ueResults.map((ue) => (
              <React.Fragment key={ue.ueCode}>
                <tr className="ue-row">
                  <td className="left" colSpan={2} style={{ background: "#B91C2F", color: "white", fontWeight: "bold", border: "1px solid #9B1826" }}>
                    {ue.ueCode} : {ue.ueName}
                  </td>
                  <td style={{ background: "#B91C2F", color: "white", border: "1px solid #9B1826" }}>{ue.totalCredits}</td>
                  <td colSpan={3} style={{ background: "#B91C2F", color: "white", border: "1px solid #9B1826" }}>
                    <span style={{ fontSize: "8px" }}>Moy. UE :</span> {ue.average != null ? ue.average.toFixed(2) : "-"}
                  </td>
                  <td style={{ background: "#B91C2F", color: "white", fontWeight: "bold", border: "1px solid #9B1826" }}>
                    {ue.average != null ? ue.average.toFixed(2) : "-"}
                  </td>
                  <td style={{ background: "#B91C2F", color: "white", border: "1px solid #9B1826" }}>
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
                      <span className={c.noteFinal == null ? "na" : c.noteFinal >= 10 ? "ok" : "ko"}>
                        {fmt(c.noteFinal)}
                      </span>
                    </td>
                    <td>
                      <span className={c.noteFinal == null ? "na" : c.validated ? "ok" : "ko"}>
                        {c.noteFinal == null ? "-" : c.validated ? "Valide" : "Ajourne"}
                      </span>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Bilan et decision */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px", marginTop: "6px" }}>
          {/* Gauche : stats + graphique */}
          <div>
            <div style={{ border: "1.5px solid #1A1A1A", borderRadius: "4px", padding: "6px 8px", fontSize: "9px", marginBottom: "6px" }}>
              <div style={{ marginBottom: "5px" }}>
                <strong>Credits valides :</strong> {data.totalValidatedCredits} / {data.totalCredits}
              </div>
              <div style={{ marginBottom: "5px" }}>
                <strong>Mention :</strong>{" "}
                <span style={{ color: admis ? "#15803d" : "#b91c1c", fontWeight: "bold" }}>{data.mention}</span>
              </div>
              <div style={{ marginBottom: "5px" }}>
                <strong>Classement :</strong> {data.rank} de la promotion
              </div>
              {/* Barre de progression credits */}
              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "8px", color: "#777", marginBottom: "3px" }}>Taux de validation des credits</div>
                <div style={{ background: "#eee", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                  <div style={{
                    width: `${data.totalCredits > 0 ? Math.round((data.totalValidatedCredits / data.totalCredits) * 100) : 0}%`,
                    height: "100%",
                    background: admis ? "#15803d" : "#b91c1c",
                    borderRadius: "4px"
                  }} />
                </div>
                <div style={{ fontSize: "8px", color: "#888", marginTop: "2px", textAlign: "right" }}>
                  {data.totalCredits > 0 ? Math.round((data.totalValidatedCredits / data.totalCredits) * 100) : 0}%
                </div>
              </div>
            </div>
            {/* Graphique de progression */}
            <ProgressChart ueResults={data.ueResults} />
          </div>

          {/* Droite : decision */}
          <div style={{
            border: `2.5px solid ${admis ? "#15803d" : "#b91c1c"}`,
            borderRadius: "6px",
            padding: "8px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div style={{ fontSize: "8px", color: "#777", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Moyenne Generale / General Average
            </div>
            <div style={{ fontSize: "22px", fontWeight: "900", color: admis ? "#15803d" : "#b91c1c", lineHeight: 1 }}>
              {avg != null ? avg.toFixed(2) : "-"}<span style={{ fontSize: "12px" }}>/20</span>
            </div>
            <div style={{
              marginTop: "6px",
              fontSize: "12px",
              fontWeight: "900",
              color: admis ? "#15803d" : "#b91c1c",
              textTransform: "uppercase",
              letterSpacing: "1px",
              border: `1.5px solid ${admis ? "#15803d" : "#b91c1c"}`,
              padding: "3px 10px",
              borderRadius: "4px",
            }}>
              {data.decision}
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "10px", fontSize: "9px", textAlign: "center" }}>
          {["Le Directeur Pedagogique", "Le Responsable de Filiere", "Le Secretariat Academique"].map((label) => (
            <div key={label}>
              <div style={{ borderTop: "1px solid #555", paddingTop: "5px", marginTop: "18px", color: "#333" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Pied de page */}
        <div style={{ marginTop: "8px", textAlign: "center", fontSize: "8.5px", color: "#aaa", borderTop: "1px solid #e0e0e0", paddingTop: "7px" }}>
          Africa Leadership Higher Institute - Chateau Ngoa Ekele, Yaounde, Cameroun - Tel : (+237) 657 75 54 87
          <br />
          Ce document est un releve officiel de notes. Toute falsification est passible de sanctions disciplinaires et penales.
        </div>
      </div>
    </>
  );
}
