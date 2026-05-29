"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText, Printer, BookOpen, ToggleLeft, ToggleRight, ExternalLink, ArrowLeft } from "lucide-react";

type Filiere = {
  id: string;
  code: string;
  name: string;
  bulletinsPublished: boolean;
};

type StudentRow = {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  avg: number | null;
  credits: number;
  mention: string;
};

function getMentionColor(mention: string): string {
  if (mention.includes("Tres Bien") || mention.includes("Excellent")) return "#d97706";
  if (mention.includes("Bien")) return "#16a34a";
  if (mention.includes("Assez")) return "#2563eb";
  if (mention.includes("Passable") || mention.includes("Admis")) return "#6b7280";
  return "#B91C2F";
}

export default function BulletinsPage() {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedFiliereId, setSelectedFiliereId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [toggling, setToggling] = useState(false);

  const loadFilieres = useCallback(async () => {
    const res = await fetch("/api/filieres");
    if (res.ok) {
      const data: Filiere[] = await res.json();
      setFilieres(data);
      if (data.length > 0 && !selectedFiliereId) setSelectedFiliereId(data[0].id);
    }
    setLoading(false);
  }, [selectedFiliereId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadFilieres(); }, [loadFilieres]);

  useEffect(() => {
    if (!selectedFiliereId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingStudents(true);
    fetch(`/api/examens/bulletins-summary?filiereId=${selectedFiliereId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: StudentRow[]) => setStudents(data))
      .finally(() => setLoadingStudents(false));
  }, [selectedFiliereId]);

  const selectedFiliere = filieres.find((f) => f.id === selectedFiliereId);

  async function togglePublish() {
    if (!selectedFiliere) return;
    setToggling(true);
    const res = await fetch(`/api/filieres/${selectedFiliere.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bulletinsPublished: !selectedFiliere.bulletinsPublished }),
    });
    if (res.ok) {
      const updated: Filiere = await res.json();
      setFilieres((prev) => prev.map((f) => f.id === updated.id ? { ...f, bulletinsPublished: updated.bulletinsPublished } : f));
    }
    setToggling(false);
  }

  function printAllBulletins() {
    students.forEach((s, i) => {
      setTimeout(() => {
        window.open(`/print/bulletin/${s.id}?semester=1&year=2025-2026`, `_bulletin_${s.id}`);
      }, i * 300);
    });
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--text-muted)" }}>
      Chargement...
    </div>
  );

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/examens" style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textDecoration: "none", marginBottom: "10px" }}>
          <ArrowLeft style={{ width: "13px", height: "13px" }} />Retour
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text)", marginBottom: "3px" }}>Bulletins de notes</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Releves semestriels, Semestre 1, 2025-2026</p>
        </div>
        {selectedFiliere && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={printAllBulletins}
              disabled={students.length === 0}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "var(--bg-card)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: "9px", fontWeight: "600", fontSize: "12px", cursor: students.length === 0 ? "not-allowed" : "pointer", opacity: students.length === 0 ? 0.5 : 1 }}
            >
              <Printer style={{ width: "13px", height: "13px" }} />
              Tout imprimer ({students.length})
            </button>
            <button
              onClick={togglePublish}
              disabled={toggling}
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "8px 16px", background: selectedFiliere.bulletinsPublished ? "#16a34a" : "#B91C2F", color: "white", borderRadius: "9px", fontWeight: "700", fontSize: "12px", border: "none", cursor: toggling ? "not-allowed" : "pointer", opacity: toggling ? 0.7 : 1 }}
            >
              {selectedFiliere.bulletinsPublished
                ? <><ToggleRight style={{ width: "14px", height: "14px" }} />Bulletins publies</>
                : <><ToggleLeft style={{ width: "14px", height: "14px" }} />Publier bulletins</>
              }
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Publication notice */}
      {selectedFiliere && (
        <div style={{ marginBottom: "14px", padding: "10px 16px", borderRadius: "10px", background: selectedFiliere.bulletinsPublished ? "#16a34a18" : "#B91C2F18", border: `1px solid ${selectedFiliere.bulletinsPublished ? "#16a34a40" : "#B91C2F30"}`, fontSize: "12px", color: selectedFiliere.bulletinsPublished ? "#16a34a" : "#B91C2F", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
          <BookOpen style={{ width: "14px", height: "14px", flexShrink: 0 }} />
          {selectedFiliere.bulletinsPublished
            ? `Bulletins de ${selectedFiliere.name} sont visibles par les etudiants et parents.`
            : `Bulletins de ${selectedFiliere.name} non publies. Les etudiants et parents ne peuvent pas les consulter.`}
        </div>
      )}

      {/* Filiere tabs */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
        {filieres.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFiliereId(f.id)}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              border: "1.5px solid",
              borderColor: selectedFiliereId === f.id ? "#B91C2F" : "var(--border)",
              background: selectedFiliereId === f.id ? "#B91C2F" : "var(--bg-card)",
              color: selectedFiliereId === f.id ? "white" : "var(--text)",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {f.code}
            {f.bulletinsPublished && (
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: selectedFiliereId === f.id ? "rgba(255,255,255,0.8)" : "#16a34a", flexShrink: 0 }} />
            )}
          </button>
        ))}
      </div>

      {/* Students table */}
      {selectedFiliere && (
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText style={{ width: "15px", height: "15px", color: "#B91C2F" }} />
            <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>{selectedFiliere.name}</span>
            <span style={{ padding: "2px 8px", background: "#2563eb20", color: "#2563eb", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>{students.length} etudiants</span>
          </div>

          {loadingStudents ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-muted)" }}>
                    {["#", "Etudiant", "Matricule", "Moyenne", "Credits valides", "Mention", ""].map((h) => (
                      <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: "600", color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => (
                    <tr key={student.id} className="row-hover" style={{ borderTop: "1px solid var(--border-muted)" }}>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: "11px" }}>{idx + 1}</td>
                      <td style={{ padding: "10px 14px", fontWeight: "600", color: "var(--text)" }}>{student.lastName} {student.firstName}</td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "var(--text-muted)", fontSize: "11px" }}>{student.matricule}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {student.avg != null ? (
                          <span style={{ fontWeight: "700", color: student.avg >= 10 ? "#16a34a" : "#B91C2F" }}>
                            {student.avg.toFixed(2)}/20
                          </span>
                        ) : <span style={{ color: "var(--text-muted)" }}>-</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>{student.credits} crd.</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: getMentionColor(student.mention) }}>
                          {student.mention}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <Link
                          href={`/print/bulletin/${student.id}?semester=1&year=2025-2026`}
                          target="_blank"
                          style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", background: "#B91C2F", color: "white", borderRadius: "6px", fontSize: "11px", fontWeight: "600", textDecoration: "none" }}
                        >
                          <ExternalLink style={{ width: "11px", height: "11px" }} />
                          Bulletin
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                        Aucun etudiant actif dans cette filiere.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
