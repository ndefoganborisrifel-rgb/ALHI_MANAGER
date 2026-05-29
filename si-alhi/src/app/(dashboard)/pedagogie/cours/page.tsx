"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, BookOpen, Search, GraduationCap, ArrowLeft } from "lucide-react";
import { useCanManage } from "@/components/providers/RoleProvider";

type Filiere = { id: string; code: string; name: string; coursesPublished?: boolean };
type UE = { id: string; code: string; name: string };
type Course = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  credits: number;
  totalHours: number;
  semester: number;
  ueCode: string;
  ueName: string;
  filiereId: string;
  filiere: Filiere;
  ue?: UE | null;
};

const emptyForm = {
  code: "",
  name: "",
  description: "",
  credits: 3,
  totalHours: 30,
  semester: 1,
  ueCode: "",
  ueName: "",
  filiereId: "",
};

export default function CoursPage() {
  const canManage = useCanManage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFiliereId, setFilterFiliereId] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [publishLoading, setPublishLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, fRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/filieres"),
      ]);
      const [c, f] = await Promise.all([
        cRes.ok ? cRes.json() : [],
        fRes.ok ? fRes.json() : [],
      ]);
      setCourses(c);
      setFilieres(f);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, [loadData]);

  const filtered = courses.filter((c) => {
    const matchFiliere = !filterFiliereId || c.filiereId === filterFiliereId;
    const q = search.toLowerCase();
    const matchSearch = !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.ueCode.toLowerCase().includes(q);
    return matchFiliere && matchSearch;
  });

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm, filiereId: filieres[0]?.id ?? "" });
    setError("");
    setShowModal(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setForm({
      code: course.code,
      name: course.name,
      description: course.description ?? "",
      credits: course.credits,
      totalHours: course.totalHours,
      semester: course.semester,
      ueCode: course.ueCode,
      ueName: course.ueName,
      filiereId: course.filiereId,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        credits: Number(form.credits),
        totalHours: Number(form.totalHours),
        semester: Number(form.semester),
        description: form.description || undefined,
      };
      const url = editing ? `/api/courses/${editing.id}` : "/api/courses";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement.");
        return;
      }
      setShowModal(false);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublish(filiere: Filiere) {
    const willPublish = !filiere.coursesPublished;
    const confirmMsg = willPublish
      ? `Publier la liste des matieres de ${filiere.name} ? Les etudiants et parents pourront la consulter.`
      : `Retirer la publication des matieres de ${filiere.name} ?`;
    if (!confirm(confirmMsg)) return;
    setPublishLoading(true);
    try {
      const res = await fetch(`/api/filieres/${filiere.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coursesPublished: willPublish }),
      });
      if (res.ok) await loadData();
    } finally {
      setPublishLoading(false);
    }
  }

  async function handleDelete(course: Course) {
    if (!confirm(`Supprimer le cours "${course.name}" ?`)) return;
    const res = await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Erreur lors de la suppression.");
      return;
    }
    setCourses((prev) => prev.filter((c) => c.id !== course.id));
  }

  const semesterGroups: Record<number, Course[]> = {};
  for (const c of filtered) {
    if (!semesterGroups[c.semester]) semesterGroups[c.semester] = [];
    semesterGroups[c.semester].push(c);
  }

  const totalCredits = filtered.reduce((s, c) => s + c.credits, 0);
  const totalHours = filtered.reduce((s, c) => s + c.totalHours, 0);

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <Link href="/pedagogie" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)", textDecoration: "none", fontWeight: "500" }}>
              <ArrowLeft style={{ width: "13px", height: "13px" }} />Pedagogie
            </Link>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text)", marginBottom: "3px" }}>Matieres et UE</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Gestion des cours, unites d&apos;enseignement et credits
          </p>
        </div>
        {canManage && (
          <button
            onClick={openAdd}
            style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "#B91C2F", color: "white", borderRadius: "9px", fontWeight: "700", fontSize: "13px", border: "none", cursor: "pointer" }}
          >
            <Plus style={{ width: "15px", height: "15px" }} />
            Nouveau cours
          </button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
        {[
          { label: "Cours total", value: filtered.length, icon: BookOpen, color: "#2563eb" },
          { label: "Credits totaux", value: totalCredits, icon: GraduationCap, color: "#16a34a" },
          { label: "Heures totales", value: totalHours, icon: BookOpen, color: "#B91C2F" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "16px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${kpi.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: "19px", height: "19px", color: kpi.color }} />
              </div>
              <div>
                <p style={{ fontSize: "24px", fontWeight: "800", color: kpi.color, lineHeight: 1, marginBottom: "2px" }}>{kpi.value}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Rechercher un cours ou UE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <select
          value={filterFiliereId}
          onChange={(e) => setFilterFiliereId(e.target.value)}
          style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", minWidth: "180px" }}
        >
          <option value="">Toutes les filieres</option>
          {filieres.map((f) => (
            <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
          ))}
        </select>
        {canManage && filterFiliereId && (() => {
          const sel = filieres.find((f) => f.id === filterFiliereId);
          if (!sel) return null;
          return (
            <button
              onClick={() => togglePublish(sel)}
              disabled={publishLoading}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                border: "none",
                cursor: publishLoading ? "not-allowed" : "pointer",
                opacity: publishLoading ? 0.7 : 1,
                background: sel.coursesPublished ? "#16a34a" : "#B91C2F",
                color: "white",
                whiteSpace: "nowrap",
              }}
            >
              {sel.coursesPublished ? "Matieres publiees" : "Publier les matieres"}
            </button>
          );
        })()}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
          Aucun cours trouve. Commencez par ajouter un cours.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {Object.entries(semesterGroups)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([sem, list]) => (
              <div key={sem} style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)" }}>Semestre {sem}</span>
                  <span style={{ padding: "2px 8px", background: "#2563eb20", color: "#2563eb", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>{list.length} cours</span>
                  <span style={{ padding: "2px 8px", background: "#16a34a20", color: "#16a34a", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>{list.reduce((s, c) => s + c.credits, 0)} credits</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-muted)" }}>
                        {["Code", "Intitule", "UE", "Filiere", "Credits", "Heures", ""].map((h) => (
                          <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: "600", color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((course) => (
                        <tr key={course.id} className="row-hover" style={{ borderTop: "1px solid var(--border-muted)" }}>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#B91C2F", fontSize: "12px" }}>{course.code}</span>
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <p style={{ fontWeight: "600", color: "var(--text)", marginBottom: "1px" }}>{course.name}</p>
                            {course.description && <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{course.description}</p>}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <div>
                              <p style={{ fontWeight: "600", fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace" }}>{course.ueCode}</p>
                              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{course.ueName}</p>
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ padding: "2px 8px", background: "var(--bg-muted)", borderRadius: "6px", fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)" }}>{course.filiere.code}</span>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "center" }}>
                            <span style={{ fontWeight: "700", color: "#2563eb", fontSize: "14px" }}>{course.credits}</span>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                            {course.totalHours}h
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {canManage && (
                                <button
                                  onClick={() => openEdit(course)}
                                  style={{ padding: "4px 10px", background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "11px", fontWeight: "600", color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                                >
                                  <Pencil style={{ width: "11px", height: "11px" }} />Modifier
                                </button>
                              )}
                              {canManage && (
                                <button
                                  onClick={() => handleDelete(course)}
                                  style={{ padding: "4px 10px", background: "#B91C2F15", border: "1px solid #B91C2F30", borderRadius: "6px", fontSize: "11px", fontWeight: "600", color: "#B91C2F", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                                >
                                  <Trash2 style={{ width: "11px", height: "11px" }} />Suppr.
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: "var(--bg-card)", borderRadius: "16px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text)" }}>
                {editing ? "Modifier le cours" : "Ajouter un cours"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Filiere */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Filiere</label>
                <select
                  required
                  value={form.filiereId}
                  onChange={(e) => setForm((f) => ({ ...f, filiereId: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none" }}
                >
                  <option value="">Selectionner une filiere...</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
                  ))}
                </select>
              </div>

              {/* Code + Nom */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Code cours</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: INF101"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Intitule du cours</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: Algorithmique et structures de donnees"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* UE Code + UE Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Code UE</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: UE-INF1"
                    value={form.ueCode}
                    onChange={(e) => setForm((f) => ({ ...f, ueCode: e.target.value.toUpperCase() }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Libelle UE</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: Informatique fondamentale"
                    value={form.ueName}
                    onChange={(e) => setForm((f) => ({ ...f, ueName: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Semestre + Credits + Heures */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Semestre</label>
                  <select
                    required
                    value={form.semester}
                    onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none" }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semestre {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Credits</label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={10}
                    value={form.credits}
                    onChange={(e) => setForm((f) => ({ ...f, credits: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Heures totales</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={form.totalHours}
                    onChange={(e) => setForm((f) => ({ ...f, totalHours: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Description optionnelle */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Description (optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="Breve description du cours..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              {error && (
                <div style={{ padding: "10px 14px", background: "#B91C2F15", border: "1px solid #B91C2F30", borderRadius: "8px", color: "#B91C2F", fontSize: "13px", fontWeight: "500" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: "10px", background: "var(--bg-muted)", border: "1.5px solid var(--border)", borderRadius: "9px", fontSize: "13px", fontWeight: "600", color: "var(--text)", cursor: "pointer" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, padding: "10px", background: "#B91C2F", border: "none", borderRadius: "9px", fontSize: "13px", fontWeight: "700", color: "white", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Enregistrement..." : editing ? "Enregistrer" : "Creer le cours"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
