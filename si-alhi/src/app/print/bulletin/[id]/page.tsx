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
  rattrapageScore: number | null;
  noteFinal: number | null;
  session: string;
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

// Seuil de validation ALHI
const PASS = 14;

function GradeLineChart({ ueResults }: { ueResults: UEResult[] }) {
  const allCourses = ueResults.flatMap((ue) => ue.courses).filter((c) => c.noteFinal != null);
  if (allCourses.length === 0) return null;

  const shown = allCourses.slice(0, 14);
  const n = shown.length;
  const W = 360, H = 130;
  const PL = 18, PR = 14, PT = 16, PB = 34;
  const cW = W - PL - PR, cH = H - PT - PB;
  const xOf = (i: number) => PL + (n <= 1 ? cW / 2 : (i / (n - 1)) * cW);
  const yOf = (v: number) => PT + cH * (1 - v / 20);
  const yPass = yOf(14);

  const pts = shown.map((c, i) => ({
    x: xOf(i),
    y: yOf(c.noteFinal!),
    score: c.noteFinal!,
    code: c.code.length > 8 ? c.code.slice(-8) : c.code,
    isRatt: c.session === "RATTRAPAGE",
  }));

  return (
    <div>
      <div style={{ fontSize: "7px", fontWeight: "bold", color: "#555", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
        Evolution des notes par matiere
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {[0, 5, 10, 14, 20].map((v) => (
          <g key={v}>
            <line x1={PL} y1={yOf(v)} x2={W - PR} y2={yOf(v)}
              stroke={v === 14 ? "#16a34a" : "#e5e7eb"}
              strokeWidth={v === 14 ? 0.8 : 0.5}
              strokeDasharray={v === 14 ? "3,2" : "2,4"} />
            <text x={PL - 2} y={yOf(v) + 2} textAnchor="end" fontSize="5" fill={v === 14 ? "#16a34a" : "#bbb"}>{v}</text>
          </g>
        ))}
        <text x={W - PR + 2} y={yPass + 2} fontSize="5.5" fill="#16a34a" fontWeight="bold">14</text>

        {pts.slice(1).map((pt, i) => {
          const prev = pts[i];
          const flat = Math.abs(pt.score - prev.score) < 0.01;
          const rising = pt.score > prev.score;
          const segColor = flat ? "#94a3b8" : rising ? "#16a34a" : "#b91c1c";
          const midX = (prev.x + pt.x) / 2;
          const midY = (prev.y + pt.y) / 2;
          const angle = Math.atan2(pt.y - prev.y, pt.x - prev.x) * (180 / Math.PI);
          return (
            <g key={i}>
              <line x1={prev.x} y1={prev.y} x2={pt.x} y2={pt.y} stroke={segColor} strokeWidth="1.5" strokeLinecap="round" />
              <g transform={`translate(${midX},${midY}) rotate(${angle})`}>
                <polygon points="4.5,0 -2,-2 -2,2" fill={segColor} opacity="0.9" />
              </g>
            </g>
          );
        })}

        {pts.map((pt, i) => {
          const color = pt.score >= 16 ? "#15803d" : pt.score >= 14 ? "#16a34a" : pt.score >= 10 ? "#d97706" : "#b91c1c";
          return (
            <g key={i}>
              {pt.isRatt && <circle cx={pt.x} cy={pt.y} r="5.5" fill="none" stroke="#fcd34d" strokeWidth="1" />}
              <circle cx={pt.x} cy={pt.y} r="3.5" fill={color} stroke="white" strokeWidth="0.8" />
              <text x={pt.x} y={pt.y - 5.5} textAnchor="middle" fontSize="5.5" fontWeight="bold" fill={color}>
                {pt.score.toFixed(1)}
              </text>
            </g>
          );
        })}

        {pts.map((pt, i) => (
          <text key={i} x={pt.x} y={H - PB + 10} textAnchor="middle" fontSize="5" fill="#888"
            {...(n > 6 ? { transform: `rotate(-30,${pt.x},${H - PB + 10})` } : {})}>
            {pt.code}
          </text>
        ))}
      </svg>
      <div style={{ fontSize: "6px", color: "#aaa", marginTop: "1px", fontStyle: "italic", display: "flex", gap: "8px" }}>
        <span style={{ color: "#16a34a" }}>▲ Progression</span>
        <span style={{ color: "#b91c1c" }}>▼ Regression</span>
        <span>Seuil vert = 14/20</span>
        <span>R = Rattrapage</span>
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
  const admis = avg != null && avg >= PASS;
  const dateEdition = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const creditPct = data.totalCredits > 0 ? Math.round((data.totalValidatedCredits / data.totalCredits) * 100) : 0;

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; font-size: 8.5px !important; }
          .page { box-shadow: none !important; margin: 0 !important; padding: 6mm 8mm !important; }
          @page { size: A4 portrait; margin: 4mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .ue-row td { background: #B91C2F !important; color: white !important; }
          th { background: #1A1A1A !important; color: white !important; }
        }
        body {
          background: #d8d8d8;
          font-family: "Times New Roman", Times, serif;
          font-size: 9.5px;
          color: #1A1A1A;
        }
        .page {
          background: white;
          position: relative;
          overflow: hidden;
          max-width: 210mm;
          margin: 16px auto;
          padding: 8mm 10mm;
          box-shadow: 0 6px 32px rgba(0,0,0,0.22);
        }
        table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
        th {
          background: #1A1A1A;
          color: white;
          font-weight: bold;
          padding: 3px 4px;
          text-align: center;
          border: 1px solid #1A1A1A;
          font-size: 7.5px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        th.left { text-align: left; }
        td { border: 1px solid #ccc; padding: 2px 4px; text-align: center; vertical-align: middle; }
        td.left { text-align: left; }
        td.mono { font-family: monospace; font-size: 7.5px; color: #555; }
        .ue-row td { background: #B91C2F !important; color: white; font-weight: bold; border-color: #9B1826; }
        tr:nth-child(even) td { background: #fafafa; }
        .ue-row td { background: #B91C2F !important; }
        .ok { color: #15803d; font-weight: bold; }
        .ratt { color: #d97706; font-weight: bold; }
        .ko { color: #b91c1c; font-weight: bold; }
        .na { color: #aaa; }
        .sep { height: 3px; }
      `}</style>

      {/* Print toolbar */}
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 100, background: "#1A1A1A", padding: "9px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: "#aaa", fontFamily: "sans-serif", fontSize: "12px" }}>
          Bulletin : {data.student.lastName} {data.student.firstName} | S{data.semester} | {data.academicYear}
        </span>
        <button onClick={() => window.print()} style={{ marginLeft: "auto", background: "#B91C2F", color: "white", border: "none", padding: "7px 22px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", fontFamily: "sans-serif" }}>
          Imprimer / PDF
        </button>
        <button onClick={() => window.close()} style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontFamily: "sans-serif" }}>
          Fermer
        </button>
      </div>

      <div className="page">
        {/* Filigrane */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" style={{ width: "240px", opacity: 0.05, objectFit: "contain" }} />
        </div>
        {/* Contenu */}
        <div style={{ position: "relative" }}>

        {/* EN-TETE OFFICIELLE 3 COLONNES */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 1fr", gap: "6px", paddingBottom: "5px", marginBottom: "5px", borderBottom: "1.5px solid #1A1A1A" }}>
          <div style={{ textAlign: "center", fontSize: "8px", lineHeight: "1.5" }}>
            <div style={{ fontWeight: "900", fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>REPUBLIQUE DU CAMEROUN</div>
            <div style={{ fontStyle: "italic", color: "#444", fontSize: "7.5px" }}>Paix - Travail - Patrie</div>
            <div className="sep" />
            <div style={{ fontWeight: "700", fontSize: "7.5px", textTransform: "uppercase" }}>Ministere des Enseignements Superieurs</div>
            <div className="sep" />
            <div style={{ fontWeight: "800", color: "#B91C2F", fontSize: "8.5px", textTransform: "uppercase" }}>Africa Leadership Higher Institute</div>
            <div style={{ color: "#555", fontSize: "7px", marginTop: "2px" }}>Chateau Ngoa Ekele, Yaounde, Cameroun</div>
            <div style={{ color: "#555", fontSize: "7px" }}>Tel : (+237) 657 75 54 87 / 676 25 85 13</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ALHI" style={{ width: "60px", height: "60px", objectFit: "contain" }} />
          </div>
          <div style={{ textAlign: "center", fontSize: "8px", lineHeight: "1.5" }}>
            <div style={{ fontWeight: "900", fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>REPUBLIC OF CAMEROON</div>
            <div style={{ fontStyle: "italic", color: "#444", fontSize: "7.5px" }}>Peace - Work - Fatherland</div>
            <div className="sep" />
            <div style={{ fontWeight: "700", fontSize: "7.5px", textTransform: "uppercase" }}>Ministry of Higher Education</div>
            <div className="sep" />
            <div style={{ fontWeight: "800", color: "#B91C2F", fontSize: "8.5px", textTransform: "uppercase" }}>Africa Leadership Higher Institute</div>
            <div style={{ color: "#555", fontSize: "7px", marginTop: "2px" }}>info@africaleadershipinstitute.com</div>
            <div style={{ color: "#555", fontSize: "7px" }}>www.africaleadershipinstitute.com</div>
          </div>
        </div>

        {/* Titre */}
        <div style={{ textAlign: "center", marginBottom: "7px", padding: "4px 0" }}>
          <div style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2.5px", color: "#1A1A1A" }}>
            Releve de Notes Semestriel
          </div>
          <div style={{ fontSize: "9px", fontStyle: "italic", color: "#666", marginTop: "1px" }}>
            Semester Transcript / Semestre {data.semester}, Annee Academique {data.academicYear}
          </div>
        </div>

        {/* Infos etudiant */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "7px", fontSize: "8.5px" }}>
          <div style={{ border: "1.5px solid #B91C2F", borderRadius: "4px", padding: "6px 9px" }}>
            <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
              <span style={{ fontWeight: "bold", flexShrink: 0 }}>Nom(s) et Prenom(s) :</span>
              <span style={{ fontWeight: "900" }}>{data.student.lastName} {data.student.firstName}</span>
            </div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
              <span style={{ fontStyle: "italic", fontSize: "7.5px", color: "#888" }}>Name and surname</span>
            </div>
            {data.student.dateOfBirth && (
              <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
                <span style={{ fontWeight: "bold" }}>Ne(e) le :</span>
                <span>{new Date(data.student.dateOfBirth).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
              </div>
            )}
            {data.student.gender && (
              <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
                <span style={{ fontWeight: "bold" }}>Sexe :</span>
                <span>{data.student.gender === "M" ? "Masculin" : "Feminin"}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: "4px" }}>
              <span style={{ fontWeight: "bold" }}>Specialite :</span>
              <span>{data.student.major}</span>
            </div>
          </div>
          <div style={{ border: "1.5px solid #ccc", borderRadius: "4px", padding: "6px 9px" }}>
            <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
              <span style={{ fontWeight: "bold" }}>Matricule :</span>
              <span style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: "10px" }}>{data.student.matricule}</span>
            </div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
              <span style={{ fontWeight: "bold" }}>Niveau :</span>
              <span>Annee {data.student.level}</span>
            </div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
              <span style={{ fontWeight: "bold" }}>Classement :</span>
              <span>{data.rank} de la promotion</span>
            </div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
              <span style={{ fontWeight: "bold" }}>Annee Academique :</span>
              <span>{data.academicYear}</span>
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
              <th className="left" style={{ width: "7%" }}>Code</th>
              <th className="left">Matiere / Course</th>
              <th style={{ width: "5%" }}>Crd.</th>
              <th style={{ width: "6%" }}>CC1</th>
              <th style={{ width: "6%" }}>CC2</th>
              <th style={{ width: "9%" }}>Exam. N.</th>
              <th style={{ width: "9%" }}>Exam. R.</th>
              <th style={{ width: "7%" }}>Note/20</th>
              <th style={{ width: "9%" }}>Resultat</th>
            </tr>
          </thead>
          <tbody>
            {data.ueResults.map((ue) => (
              <React.Fragment key={ue.ueCode}>
                <tr className="ue-row">
                  <td className="left" colSpan={2} style={{ background: "#B91C2F", color: "white", fontWeight: "bold", border: "1px solid #9B1826", fontSize: "8px" }}>
                    {ue.ueCode} : {ue.ueName}
                  </td>
                  <td style={{ background: "#B91C2F", color: "white", border: "1px solid #9B1826" }}>{ue.totalCredits}</td>
                  <td colSpan={4} style={{ background: "#B91C2F", color: "white", border: "1px solid #9B1826", fontSize: "7.5px" }}>
                    Moy. UE : {ue.average != null ? ue.average.toFixed(2) : "-"}
                  </td>
                  <td style={{ background: "#B91C2F", color: "white", fontWeight: "bold", border: "1px solid #9B1826" }}>
                    {ue.average != null ? ue.average.toFixed(2) : "-"}
                  </td>
                  <td style={{ background: "#B91C2F", color: "white", border: "1px solid #9B1826", fontSize: "7.5px" }}>
                    {ue.validatedCredits}/{ue.totalCredits} crd.
                  </td>
                </tr>
                {ue.courses.map((c) => {
                  const isRatt = c.session === "RATTRAPAGE";
                  const resultClass = c.noteFinal == null ? "na" : c.validated ? "ok" : (c.noteFinal >= 10 ? "ratt" : "ko");
                  return (
                    <tr key={c.code}>
                      <td className="mono">{c.code}</td>
                      <td className="left" style={{ fontSize: "8px" }}>
                        {c.name}
                        {isRatt && <span style={{ marginLeft: "4px", fontSize: "7px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "2px", padding: "0 3px", color: "#92400e" }}>Ratt.</span>}
                      </td>
                      <td>{c.credits}</td>
                      <td>{fmt(c.cc1)}</td>
                      <td>{fmt(c.cc2)}</td>
                      <td>{fmt(c.examScore)}</td>
                      <td style={{ color: isRatt ? "#d97706" : "#aaa", fontWeight: isRatt ? "bold" : "normal" }}>
                        {isRatt ? fmt(c.rattrapageScore) : "-"}
                      </td>
                      <td>
                        <span className={resultClass}>{fmt(c.noteFinal)}</span>
                      </td>
                      <td>
                        <span className={resultClass}>
                          {c.noteFinal == null ? "-" : c.validated ? "Valide" : c.noteFinal >= 10 ? "Rattrapage" : "Echec"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Bilan et graphique */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px", marginTop: "7px" }}>
          {/* Gauche : stats + graphique */}
          <div>
            <div style={{ border: "1.5px solid #1A1A1A", borderRadius: "4px", padding: "5px 7px", fontSize: "8.5px", marginBottom: "5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                <span><strong>Credits valides :</strong> {data.totalValidatedCredits} / {data.totalCredits}</span>
                <span><strong>Rang :</strong> {data.rank}</span>
              </div>
              <div style={{ marginBottom: "4px" }}>
                <strong>Mention :</strong>{" "}
                <span style={{ color: admis ? "#15803d" : "#b91c1c", fontWeight: "bold" }}>{data.mention}</span>
              </div>
              {/* Barre credits */}
              <div>
                <div style={{ fontSize: "7px", color: "#777", marginBottom: "2px" }}>Taux de validation des credits</div>
                <div style={{ background: "#e5e7eb", borderRadius: "4px", height: "7px", overflow: "hidden" }}>
                  <div style={{ width: `${creditPct}%`, height: "100%", background: admis ? "#15803d" : creditPct >= 50 ? "#d97706" : "#b91c1c", borderRadius: "4px" }} />
                </div>
                <div style={{ fontSize: "7px", color: "#888", marginTop: "1px", textAlign: "right" }}>{creditPct}%</div>
              </div>
            </div>
            {/* Graphique par cours */}
            <GradeLineChart ueResults={data.ueResults} />
          </div>

          {/* Droite : decision */}
          <div style={{ border: `2.5px solid ${admis ? "#15803d" : "#b91c1c"}`, borderRadius: "6px", padding: "10px 8px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <div style={{ fontSize: "7.5px", color: "#777", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              Moyenne Generale / General Average
            </div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: admis ? "#15803d" : "#b91c1c", lineHeight: 1 }}>
              {avg != null ? avg.toFixed(2) : "-"}<span style={{ fontSize: "13px" }}>/20</span>
            </div>
            <div style={{ fontSize: "7px", color: "#888" }}>Seuil de validation : 14/20</div>
            <div style={{
              fontSize: "13px",
              fontWeight: "900",
              color: admis ? "#15803d" : "#b91c1c",
              textTransform: "uppercase",
              letterSpacing: "1px",
              border: `1.5px solid ${admis ? "#15803d" : "#b91c1c"}`,
              padding: "4px 14px",
              borderRadius: "4px",
            }}>
              {data.decision}
            </div>
            <div style={{ fontSize: "7px", color: admis ? "#15803d" : "#b91c1c", fontStyle: "italic" }}>
              {admis ? `${data.totalValidatedCredits} credits valides` : "Insuffisant pour la validation"}
            </div>
          </div>
        </div>

        {/* Signatures : uniquement Directrice et DAAC */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "12px", fontSize: "8.5px", textAlign: "center" }}>
          <div>
            <div style={{ borderTop: "1px solid #555", paddingTop: "4px", marginTop: "22px", color: "#333" }}>
              <div style={{ fontWeight: "bold" }}>La Directrice de l&apos;Institut</div>
              <div style={{ fontSize: "7.5px", color: "#777", marginTop: "1px" }}>The Director</div>
            </div>
          </div>
          <div>
            <div style={{ borderTop: "1px solid #555", paddingTop: "4px", marginTop: "22px", color: "#333" }}>
              <div style={{ fontWeight: "bold" }}>La DAAC</div>
              <div style={{ fontSize: "7.5px", color: "#777", marginTop: "1px" }}>Direction des Affaires Academiques et de la Conformite</div>
            </div>
          </div>
        </div>

        {/* Legende */}
        <div style={{ marginTop: "6px", display: "flex", gap: "12px", fontSize: "7px", color: "#888", justifyContent: "center" }}>
          <span><span style={{ color: "#15803d", fontWeight: "bold" }}>Valide</span> : note finale ≥ 14/20</span>
          <span><span style={{ color: "#d97706", fontWeight: "bold" }}>Rattrapage</span> : 10 ≤ note &lt; 14</span>
          <span><span style={{ color: "#b91c1c", fontWeight: "bold" }}>Echec</span> : note &lt; 10</span>
          <span><span style={{ fontWeight: "bold" }}>Ratt.</span> = Session de rattrapage</span>
        </div>

        {/* Pied de page */}
        <div style={{ marginTop: "5px", textAlign: "center", fontSize: "7.5px", color: "#aaa", borderTop: "1px solid #e0e0e0", paddingTop: "5px" }}>
          Africa Leadership Higher Institute - Chateau Ngoa Ekele, Yaounde, Cameroun - Tel : (+237) 657 75 54 87
          <br />
          Ce document est un releve officiel de notes. Toute falsification est passible de sanctions disciplinaires et penales.
        </div>
        </div>
      </div>
    </>
  );
}
