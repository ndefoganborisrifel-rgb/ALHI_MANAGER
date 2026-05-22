import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { UserPlus } from "lucide-react";
import Link from "next/link";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  SCOLARITE: "Scolarité",
  ENSEIGNANT: "Enseignant",
  ETUDIANT: "Étudiant",
  PARENT: "Parent",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  SCOLARITE: "bg-blue-100 text-blue-800",
  ENSEIGNANT: "bg-purple-100 text-purple-800",
  ETUDIANT: "bg-green-100 text-green-800",
  PARENT: "bg-orange-100 text-orange-800",
};

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { role: "asc" },
    take: 100,
  });

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-500 text-sm">{users.length} comptes au total</p>
        </div>
        <Link href="/users/nouveau">
          <Button><UserPlus className="w-4 h-4 mr-2" />Nouveau compte</Button>
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
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>MDP initial</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
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
                      <span className="text-xs text-orange-600">⚠ À changer</span>
                    ) : (
                      <span className="text-xs text-green-600">✓ Changé</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(user.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
