"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { UserPlus, Copy, CheckCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

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
  SCOLARITE: "Scolarite",
  ENSEIGNANT: "Enseignant",
  ETUDIANT: "Etudiant",
  PARENT: "Parent",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  SCOLARITE: "bg-blue-100 text-blue-800",
  ENSEIGNANT: "bg-purple-100 text-purple-800",
  ETUDIANT: "bg-green-100 text-green-800",
  PARENT: "bg-orange-100 text-orange-800",
};

const emptyEditForm = { firstName: "", lastName: "", email: "", role: "ETUDIANT" as string, isActive: true };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!confirm(`Reinitialiser le mot de passe de ${user.firstName} ${user.lastName} ?`)) return;
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Erreur lors de la reinitialisation.");
      return;
    }
    setTempPassword(data.tempPassword ?? "");
    setResetUserName(`${user.firstName} ${user.lastName}`);
    setPasswordCopied(false);
    setShowPasswordDialog(true);
    loadData();
  }

  async function handleDeactivate(user: User) {
    if (!confirm(`Desactiver le compte de ${user.firstName} ${user.lastName} ?`)) return;
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    loadData();
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(tempPassword);
    setPasswordCopied(true);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-500 text-sm">{users.length} comptes au total</p>
        </div>
        <Link href="/users/nouveau">
          <Button className="bg-[#B91C2F] hover:bg-[#9b1727] text-white"><UserPlus className="w-4 h-4 mr-2" />Nouveau compte</Button>
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        {Object.entries(roleCounts).map(([role, count]) => (
          <Card key={role} className="min-w-28">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-500 mt-1">{roleLabels[role] ?? role}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Tous les comptes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>MDP initial</TableHead>
                <TableHead>Cree le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className={!user.isActive ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                  <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role] ?? "bg-gray-100 text-gray-800"}>
                      {roleLabels[user.role] ?? user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {user.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.mustChangePassword ? (
                      <span className="text-xs text-orange-600">A changer</span>
                    ) : (
                      <span className="text-xs text-green-600">Change</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => openEdit(user)}>Modifier</Button>
                      <Button variant="outline" size="sm" className="text-xs h-7 text-amber-700" onClick={() => handleResetPassword(user)}>Reinitialiser MDP</Button>
                      {user.isActive && (
                        <Button variant="outline" size="sm" className="text-xs h-7 text-red-600 hover:text-red-700" onClick={() => handleDeactivate(user)}>Desactiver</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">Modifier le compte</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="u-firstname">Prenom</Label>
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
                <p className="text-xs text-gray-400 mt-1">L'email ne peut pas etre modifie</p>
              </div>
              <div>
                <Label htmlFor="u-role">Role</Label>
                <Select id="u-role" value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="ADMIN">Administrateur</option>
                  <option value="SCOLARITE">Scolarite</option>
                  <option value="ENSEIGNANT">Enseignant</option>
                  <option value="ETUDIANT">Etudiant</option>
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
            <h2 className="text-lg font-bold text-gray-900 mb-2">Mot de passe reinitialise</h2>
            <p className="text-sm text-gray-600 mb-5">Le mot de passe temporaire de <strong>{resetUserName}</strong> est :</p>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
              <span className="font-mono text-lg font-bold text-gray-900 flex-1 select-all">{tempPassword}</span>
              <Button variant="outline" size="sm" onClick={copyPassword} className="shrink-0">
                {passwordCopied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-orange-600 mb-5">Communiquez ce mot de passe a l'utilisateur. Il devra le changer a la prochaine connexion.</p>
            <Button className="w-full" onClick={() => setShowPasswordDialog(false)}>Fermer</Button>
          </div>
        </div>
      )}
    </div>
  );
}
