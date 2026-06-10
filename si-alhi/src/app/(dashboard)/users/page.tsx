"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { UserPlus, Copy, CheckCheck, Users, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { PageHeader, Panel, StatusBadge } from "@/components/ui/PageUI";

const th: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 16px", fontSize: "13px", color: "var(--text)", verticalAlign: "middle" };
const roleHex: Record<string, string> = { ADMIN: "#dc2626", SCOLARITE: "#2563eb", ENSEIGNANT: "#7c3aed", ETUDIANT: "#16a34a", PARENT: "#d97706" };

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  SCOLARITE: "Scolarité",
  ENSEIGNANT: "Enseignant",
  ETUDIANT: "Étudiant",
  PARENT: "Parent",
};

const emptyEditForm = { firstName: "", lastName: "", email: "", role: "ETUDIANT" as string, isActive: true };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Password reset dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [resetUserName, setResetUserName] = useState("");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  const q = search.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchSearch = !q
      || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || (roleLabels[u.role] ?? u.role).toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  function openEdit(user: User) {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setEditError("");
    setShowEditModal(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          role: editForm.role,
          isActive: editForm.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? "Erreur."); return; }
      setShowEditModal(false);
      loadData();
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleResetPassword(user: User) {
    if (!confirm(`Réinitialiser le mot de passe de ${user.firstName} ${user.lastName} ?`)) return;
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Erreur lors de la réinitialisation.");
      return;
    }
    setTempPassword(data.tempPassword ?? "");
    setResetUserName(`${user.firstName} ${user.lastName}`);
    setPasswordCopied(false);
    setShowPasswordDialog(true);
    loadData();
  }

  async function handleDeactivate(user: User) {
    if (!confirm(`Désactiver le compte de ${user.firstName} ${user.lastName} ? L'utilisateur ne pourra plus se connecter.`)) return;
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    loadData();
  }

  async function handleReactivate(user: User) {
    if (!confirm(`Réactiver le compte de ${user.firstName} ${user.lastName} ? L'utilisateur pourra de nouveau se connecter.`)) return;
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    loadData();
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(tempPassword);
    setPasswordCopied(true);
  }

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem", color: "var(--text-muted)" }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: "1200px" }}>
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle={`${users.length} comptes au total`}
        backHref="/dashboard"
        icon={<Users style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
        actions={(
          <Link href="/users/nouveau" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 18px", background: "#B91C2F", color: "white", borderRadius: "10px", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>
            <UserPlus style={{ width: "15px", height: "15px" }} />Nouveau compte
          </Link>
        )}
      />

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
        {Object.entries(roleCounts).map(([role, count]) => {
          const tone = roleHex[role] ?? "#6b7280";
          return (
            <div key={role} style={{ background: "var(--bg-card)", borderRadius: "14px", padding: "16px 22px", border: "1px solid var(--border)", textAlign: "center", minWidth: "120px" }}>
              <p style={{ fontSize: "24px", fontWeight: 900, color: tone, lineHeight: 1 }}>{count}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>{roleLabels[role] ?? role}</p>
            </div>
          );
        })}
      </div>

      <Panel title="Tous les comptes" icon={<Users style={{ width: "15px", height: "15px", color: "#B91C2F" }} />}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Rechercher par nom, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", minWidth: "160px" }}
          >
            <option value="">Tous les roles</option>
            {Object.entries(roleLabels).map(([r, label]) => (
              <option key={r} value={r}>{label}</option>
            ))}
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-muted)" }}>
                <th style={th}>Utilisateur</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Statut</th>
                <th style={th}>MDP initial</th>
                <th style={th}>Créé le</th>
                <th style={{ ...th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>Aucun utilisateur ne correspond a la recherche.</td></tr>
              )}
              {filteredUsers.map((user, idx) => (
                <tr key={user.id} className="row-hover" style={{ borderBottom: idx < filteredUsers.length - 1 ? "1px solid var(--border-muted)" : "none", opacity: user.isActive ? 1 : 0.5 }}>
                  <td style={{ ...td, fontWeight: 600 }}>{user.firstName} {user.lastName}</td>
                  <td style={{ ...td, color: "var(--text-secondary)", fontSize: "12px" }}>{user.email}</td>
                  <td style={td}><StatusBadge label={roleLabels[user.role] ?? user.role} color={roleHex[user.role] ?? "#6b7280"} dot={false} /></td>
                  <td style={td}><StatusBadge label={user.isActive ? "Actif" : "Inactif"} color={user.isActive ? "#16a34a" : "#dc2626"} /></td>
                  <td style={td}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: user.mustChangePassword ? "#d97706" : "#16a34a" }}>{user.mustChangePassword ? "A changer" : "Change"}</span>
                  </td>
                  <td style={{ ...td, color: "var(--text-muted)", fontSize: "12px" }}>{formatDate(user.createdAt)}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                      <button onClick={() => openEdit(user)} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer" }}>Modifier</button>
                      <button onClick={() => handleResetPassword(user)} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "#d97706", cursor: "pointer" }}>Réinitialiser MDP</button>
                      {user.isActive
                        ? <button onClick={() => handleDeactivate(user)} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "#dc2626", cursor: "pointer" }}>Désactiver</button>
                        : <button onClick={() => handleReactivate(user)} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "7px", border: "1px solid #16a34a", background: "#16a34a", color: "white", cursor: "pointer" }}>Réactiver</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">Modifier le compte</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="u-firstname">Prénom</Label>
                  <Input id="u-firstname" value={editForm.firstName} onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="u-lastname">Nom</Label>
                  <Input id="u-lastname" value={editForm.lastName} onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))} required />
                </div>
              </div>
              <div>
                <Label htmlFor="u-email">Email</Label>
                <Input id="u-email" type="email" value={editForm.email} disabled className="bg-gray-50 text-gray-500" />
                <p className="text-xs text-gray-400 mt-1">L&apos;email ne peut pas être modifié</p>
              </div>
              <div>
                <Label htmlFor="u-role">Role</Label>
                <Select id="u-role" value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="ADMIN">Administrateur</option>
                  <option value="SCOLARITE">Scolarité</option>
                  <option value="ENSEIGNANT">Enseignant</option>
                  <option value="ETUDIANT">Étudiant</option>
                  <option value="PARENT">Parent</option>
                </Select>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-700">Compte actif</span>
                </label>
              </div>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>Annuler</Button>
                <Button type="submit" className="flex-1 bg-[#B91C2F] hover:bg-[#9b1727] text-white" disabled={editSubmitting}>
                  {editSubmitting ? "Enregistrement..." : "Modifier"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPasswordDialog(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Mot de passe réinitialisé</h2>
            <p className="text-sm text-gray-600 mb-5">Le mot de passe temporaire de <strong>{resetUserName}</strong> est :</p>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
              <span className="font-mono text-lg font-bold text-gray-900 flex-1 select-all">{tempPassword}</span>
              <Button variant="outline" size="sm" onClick={copyPassword} className="shrink-0">
                {passwordCopied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-orange-600 mb-5">Communiquez ce mot de passe a l&apos;utilisateur. Il devra le changer a la prochaine connexion.</p>
            <Button className="w-full" onClick={() => setShowPasswordDialog(false)}>Fermer</Button>
          </div>
        </div>
      )}
    </div>
  );
}
