"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface StudentGrade {
  id: string;
  cc1: number | null;
  cc2: number | null;
  examScore: number | null;
  noteFinal: number | null;
  session: string;
  student: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
  };
}

interface CourseInfo {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  ue: { code: string; name: string } | null;
  filiere: { code: string; name: string };
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "n/a";
  return n.toFixed(2);
}

export default function PrintPVPage() {
  const params = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const session = searchParams.get("session") ?? "NORMALE";
  const year = searchParams.get("year") ?? "2025-2026";
  const courseId = params.courseId;

  useEffect(() => {
    Promise.all([
      fetch(`/api/grades?courseId=${courseId}`).then((r) => r.json()),
      fetch(`/api/courses/${courseId}`).then((r) => r.json()),
    ])
      .then(([gradesData, courseData]) => {
        if (gradesData.error) {
          setError(gradesData.error);
          return;
        }
        if (courseData.error) {
          setError(courseData.error);
          return;
        }
        const filtered = (gradesData as StudentGrade[]).filter(
          (g) => g.session === session
        );
        const sorted = filtered.sort((a, b) =>
          a.student.lastName.localeCompare(b.student.lastName, "fr")
        );
        setGrades(sorted);
        setCourse(courseData as CourseInfo);
      })
      .catch(() => setError("Erreur de chargement des données"))
      .finally(() => setLoading(false));
  }, [courseId, session]);

  const admitted = grades.filter((g) => g.noteFinal != null && g.noteFinal >= 10).length;
  const total = grades.length;

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2 style={{ color: "#B91C2F" }}>Erreur</h2>
        <p style={{ color: "#555", marginTop: "8px" }}>{error}</p>
      </div>
    );
  }

  if (loading || !course) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif", color: "#888" }}>
        Chargement du PV en cours...
      </div>
    );
  }

  const sessionLabel = session === "NORMALE" ? "Normale" : "Rattrapage";

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
        tr:nth-child(even) td { background: #fafafa; }
        .validated { color: #15803d; font-weight: bold; }
        .failed { color: #b91c1c; font-weight: bold; }
        .neutral { color: #888; }
        .summary-row td {
          background: #f0f0f0 !important;
          font-weight: bold;
          border-top: 2px solid #1A1A1A;
        }
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
          PV de Notes : {course.code} - {course.name} ({sessionLabel})
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
                Chateau Ngoa Ekele, Yaounde, Cameroun. Tel. : +237 657 75 54 87
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
            Proces-Verbal de Notes / Grade Sheet
          </div>
        </div>

        {/* Course info box */}
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
              <strong>Code :</strong> <span style={{ fontFamily: "monospace" }}>{course.code}</span>
            </div>
            <div style={{ marginBottom: "5px" }}>
              <strong>Intitule du cours :</strong> {course.name}
            </div>
            <div style={{ marginBottom: "5px" }}>
              <strong>Filiere :</strong> {course.filiere.name} ({course.filiere.code})
            </div>
            {course.ue && (
              <div>
                <strong>UE :</strong> {course.ue.code} - {course.ue.name}
              </div>
            )}
          </div>
          <div style={{ border: "1.5px solid #ccc", borderRadius: "5px", padding: "10px 12px" }}>
            <div style={{ marginBottom: "5px" }}>
              <strong>Semestre :</strong> S{course.semester}
            </div>
            <div style={{ marginBottom: "5px" }}>
              <strong>Credits :</strong> {course.credits}
            </div>
            <div style={{ marginBottom: "5px" }}>
              <strong>Annee academique :</strong> {year}
            </div>
            <div>
              <strong>Session :</strong>{" "}
              <span
                style={{
                  color: session === "RATTRAPAGE" ? "#B91C2F" : "#15803d",
                  fontWeight: "bold",
                }}
              >
                {sessionLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Grade table */}
        <table>
          <thead>
            <tr>
              <th style={{ width: "5%" }}>N&deg;</th>
              <th style={{ width: "12%" }}>Matricule</th>
              <th className="left">Nom et Prenom</th>
              <th style={{ width: "8%" }}>CC1/20</th>
              <th style={{ width: "8%" }}>CC2/20</th>
              <th style={{ width: "10%" }}>Examen/20</th>
              <th style={{ width: "10%" }}>Note Finale/20</th>
              <th style={{ width: "10%" }}>Resultat</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g, i) => {
              const validated = g.noteFinal != null && g.noteFinal >= 10;
              return (
                <tr key={g.id}>
                  <td>{i + 1}</td>
                  <td className="mono">{g.student.matricule}</td>
                  <td className="left">
                    {g.student.lastName} {g.student.firstName}
                  </td>
                  <td>{fmt(g.cc1)}</td>
                  <td>{fmt(g.cc2)}</td>
                  <td>{fmt(g.examScore)}</td>
                  <td>
                    <span className={g.noteFinal == null ? "neutral" : validated ? "validated" : "failed"}>
                      {fmt(g.noteFinal)}
                    </span>
                  </td>
                  <td>
                    <span className={g.noteFinal == null ? "neutral" : validated ? "validated" : "failed"}>
                      {g.noteFinal == null ? "n/a" : validated ? "Valide" : "Ajoune"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {grades.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#888", fontStyle: "italic", padding: "16px" }}>
                  Aucune note saisie pour cette session.
                </td>
              </tr>
            )}
            {grades.length > 0 && (
              <tr className="summary-row">
                <td colSpan={7} className="left" style={{ paddingLeft: "10px" }}>
                  TOTAL : {admitted} admis sur {total} etudiants
                  {total > 0
                    ? ` (${((admitted / total) * 100).toFixed(1)}% de reussite)`
                    : ""}
                </td>
                <td>
                  {admitted}/{total}
                </td>
              </tr>
            )}
          </tbody>
        </table>

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
          {["L'Enseignant", "Le Directeur Pedagogique", "Le Secretariat"].map((label) => (
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
          Africa Leadership Higher Institute, Chateau Ngoa Ekele, Yaounde, Cameroun<br />
          Ce document est un proces-verbal officiel de notes. Toute falsification est passible de sanctions disciplinaires et penales.
        </div>
      </div>
    </>
  );
}
