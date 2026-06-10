"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Plus, Trash2, X, Loader2, ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useCanManage } from "@/components/providers/RoleProvider";
import { PageHeader } from "@/components/ui/PageUI";

type Photo = {
  id: string;
  promotionYear: number;
  caption: string | null;
  createdAt: string;
};

export default function MemoryPage() {
  const canManage = useCanManage();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({ promotionYear: String(currentYear), caption: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/memory");
      const data = await res.json();
      if (Array.isArray(data)) setPhotos(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setUploadError("Choisissez une photo."); return; }
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("promotionYear", form.promotionYear);
      fd.append("caption", form.caption);
      const res = await fetch("/api/memory", { method: "POST", body: fd });
      const raw = await res.text();
      let data: { error?: string } = {};
      if (raw) { try { data = JSON.parse(raw); } catch { /* reponse non JSON */ } }
      if (!res.ok) throw new Error(data.error ?? `Erreur serveur (code ${res.status})`);
      setForm((f) => ({ ...f, caption: "" }));
      if (fileRef.current) fileRef.current.value = "";
      setShowUpload(false);
      await load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette photo ?")) return;
    const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
    if (res.ok) setPhotos((prev) => prev.filter((p) => p.id !== id));
    else {
      const d = await res.json().catch(() => ({ error: "Erreur" }));
      alert(d.error ?? "Erreur lors de la suppression");
    }
  }

  // Regroupement par promotion, annees recentes en premier
  const years = Array.from(new Set(photos.map((p) => p.promotionYear))).sort((a, b) => b - a);

  // Navigation lightbox sur la liste a plat (meme ordre que l'affichage)
  const flat = years.flatMap((y) => photos.filter((p) => p.promotionYear === y));
  const lightboxPhoto = lightboxIdx != null ? flat[lightboxIdx] : null;

  useEffect(() => {
    if (lightboxIdx == null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx((i) => (i == null ? null : Math.min(i + 1, flat.length - 1)));
      if (e.key === "ArrowLeft") setLightboxIdx((i) => (i == null ? null : Math.max(i - 1, 0)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, flat.length]);

  return (
    <div className="space-y-6" style={{ maxWidth: "1200px" }}>
      <PageHeader
        title="Memory"
        subtitle="Les photos souvenirs des étudiants, promotion par promotion."
        icon={<Camera style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
      />

      {canManage && (
        <div>
          <button
            onClick={() => { setShowUpload((v) => !v); setUploadError(""); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "9px 18px", background: showUpload ? "var(--bg-muted)" : "#B91C2F",
              color: showUpload ? "var(--text)" : "white",
              border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer",
            }}
          >
            {showUpload ? <X style={{ width: "15px", height: "15px" }} /> : <Plus style={{ width: "15px", height: "15px" }} />}
            {showUpload ? "Annuler" : "Ajouter une photo"}
          </button>

          {showUpload && (
            <form
              onSubmit={handleUpload}
              style={{
                marginTop: "12px", padding: "16px", background: "var(--bg-card)",
                border: "1px solid var(--border)", borderRadius: "12px",
                display: "flex", flexDirection: "column", gap: "12px", maxWidth: "480px",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Promotion
                  </label>
                  <input
                    type="number" min="2000" max="2100" required
                    value={form.promotionYear}
                    onChange={(e) => setForm((f) => ({ ...f, promotionYear: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Légende (facultatif)
                  </label>
                  <input
                    type="text" maxLength={120} placeholder="Ex : Remise des diplômes"
                    value={form.caption}
                    onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "13px" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Photo (JPG, PNG ou WebP, 8 Mo max)
                </label>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" required style={{ fontSize: "13px", color: "var(--text)" }} />
              </div>
              {uploadError && (
                <p style={{ fontSize: "12px", color: "#B91C2F", fontWeight: "600" }}>{uploadError}</p>
              )}
              <button
                type="submit" disabled={uploading}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "9px 18px", background: uploading ? "var(--bg-muted)" : "#16a34a",
                  color: uploading ? "var(--text-muted)" : "white",
                  border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700",
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              >
                {uploading && <Loader2 style={{ width: "14px", height: "14px" }} className="animate-spin" />}
                {uploading ? "Envoi en cours..." : "Publier la photo"}
              </button>
            </form>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: "10px", color: "var(--text-muted)" }}>
          <Loader2 style={{ width: "28px", height: "28px", color: "#B91C2F" }} className="animate-spin" />
          <p style={{ fontSize: "13px" }}>Chargement des souvenirs...</p>
        </div>
      ) : photos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", border: "1px dashed var(--border)", borderRadius: "14px", color: "var(--text-muted)" }}>
          <ImageOff style={{ width: "36px", height: "36px", margin: "0 auto 10px", opacity: 0.4 }} />
          <p style={{ fontSize: "14px", fontWeight: "600" }}>Aucune photo pour le moment.</p>
          {canManage && <p style={{ fontSize: "12px", marginTop: "4px" }}>Cliquez sur "Ajouter une photo" pour créer le premier souvenir.</p>}
        </div>
      ) : (
        years.map((year) => {
          const yearPhotos = photos.filter((p) => p.promotionYear === year);
          return (
            <section key={year}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <h2 style={{ fontSize: "17px", fontWeight: "800", color: "var(--text)" }}>Promotion {year}</h2>
                <span style={{ fontSize: "11px", fontWeight: "700", background: "#B91C2F15", color: "#B91C2F", borderRadius: "20px", padding: "2px 10px" }}>
                  {yearPhotos.length} photo{yearPhotos.length > 1 ? "s" : ""}
                </span>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px" }}>
                {yearPhotos.map((p) => {
                  const flatIdx = flat.findIndex((f) => f.id === p.id);
                  return (
                    <figure
                      key={p.id}
                      style={{
                        position: "relative", borderRadius: "12px", overflow: "hidden",
                        border: "1px solid var(--border)", background: "var(--bg-card)",
                        cursor: "pointer", margin: 0,
                      }}
                      onClick={() => setLightboxIdx(flatIdx)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/memory/${p.id}/image`}
                        alt={p.caption ?? `Promotion ${p.promotionYear}`}
                        loading="lazy"
                        style={{ width: "100%", height: "150px", objectFit: "cover", display: "block" }}
                      />
                      {(p.caption || canManage) && (
                        <figcaption style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 10px" }}>
                          <span style={{ flex: 1, fontSize: "11.5px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.caption ?? ""}
                          </span>
                          {canManage && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                              title="Supprimer"
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#B91C2F", padding: "2px", display: "flex" }}
                            >
                              <Trash2 style={{ width: "13px", height: "13px" }} />
                            </button>
                          )}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxIdx(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
          }}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "8px", color: "white", padding: "8px", cursor: "pointer", display: "flex" }}
          >
            <X style={{ width: "18px", height: "18px" }} />
          </button>
          {lightboxIdx != null && lightboxIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "8px", color: "white", padding: "10px", cursor: "pointer", display: "flex" }}
            >
              <ChevronLeft style={{ width: "20px", height: "20px" }} />
            </button>
          )}
          {lightboxIdx != null && lightboxIdx < flat.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "8px", color: "white", padding: "10px", cursor: "pointer", display: "flex" }}
            >
              <ChevronRight style={{ width: "20px", height: "20px" }} />
            </button>
          )}
          <figure onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "88vh", textAlign: "center", margin: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/memory/${lightboxPhoto.id}/image`}
              alt={lightboxPhoto.caption ?? `Promotion ${lightboxPhoto.promotionYear}`}
              style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "10px", objectFit: "contain" }}
            />
            <figcaption style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", marginTop: "10px" }}>
              <strong>Promotion {lightboxPhoto.promotionYear}</strong>
              {lightboxPhoto.caption ? ` : ${lightboxPhoto.caption}` : ""}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
