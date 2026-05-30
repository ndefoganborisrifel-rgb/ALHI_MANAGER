import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, KeyRound, Calendar, BookOpen, Settings, Shield, ArrowLeft, Wrench } from "lucide-react";
import { ChangePasswordForm } from "@/components/ui/ChangePasswordForm";
import { MigrateSchedulesButton } from "@/components/ui/MigrateSchedulesButton";
import { CleanupDuplicatesButton } from "@/components/ui/CleanupDuplicatesButton";
import { RecomputeGradesButton } from "@/components/ui/RecomputeGradesButton";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  const filieres = isAdmin
    ? await prisma.filiere.findMany({ orderBy: { name: "asc" } })
    : [];

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrateur",
    SCOLARITE: "Scolarité",
    ENSEIGNANT: "Enseignant",
    ETUDIANT: "Étudiant",
    PARENT: "Parent",
  };

  const roleColors: Record<string, string> = {
    ADMIN: "bg-[#B91C2F]/10 text-[#B91C2F]",
    SCOLARITE: "bg-blue-100 text-blue-800",
    ENSEIGNANT: "bg-purple-100 text-purple-800",
    ETUDIANT: "bg-green-100 text-green-800",
    PARENT: "bg-amber-100 text-amber-800",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3 font-medium">
          <ArrowLeft className="w-4 h-4" />Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#B91C2F]/10 rounded-lg">
            <Settings className="w-5 h-5 text-[#B91C2F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parametres du compte</h1>
            <p className="text-gray-500 text-sm">Gerez votre compte et les preferences du systeme</p>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4 text-[#B91C2F]" />
            Informations du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom complet</p>
              <p className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                {session.user.name ?? <span className="text-gray-400 italic">Non renseigné</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Adresse e-mail</p>
              <p className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 break-all">
                {session.user.email ?? <span className="text-gray-400 italic">Non renseigné</span>}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rôle</p>
            <div className="flex items-center gap-2">
              <Badge className={roleColors[session.user.role] ?? "bg-gray-100 text-gray-800"}>
                <Shield className="w-3 h-3 mr-1" />
                {roleLabels[session.user.role] ?? session.user.role}
              </Badge>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3">
              Ces informations sont en lecture seule. Pour les modifier, contactez l&apos;administrateur.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="w-4 h-4 text-[#B91C2F]" />
            Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div style={{ background: "var(--bg-muted)", borderRadius: "10px", border: "1px solid var(--border)", padding: "16px" }}>
            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)", marginBottom: "3px" }}>Mot de passe</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Changez votre mot de passe pour securiser votre compte.</p>
            </div>
            <ChangePasswordForm />
          </div>
        </CardContent>
      </Card>

      {/* ADMIN-only: System Settings */}
      {isAdmin && (
        <>
          {/* Academic Year */}
          <Card>
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-[#B91C2F]" />
                Année académique
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#B91C2F] flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">2025-2026</p>
                    <p className="text-xs text-gray-500">Année académique en cours</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  En cours
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance */}
          <Card>
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="w-4 h-4 text-[#B91C2F]" />
                Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <MigrateSchedulesButton />
              <div className="border-t border-gray-100 pt-4">
                <CleanupDuplicatesButton />
              </div>
              <div className="border-t border-gray-100 pt-4">
                <RecomputeGradesButton />
              </div>
            </CardContent>
          </Card>

          {/* Filieres */}
          <Card>
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-4 h-4 text-[#B91C2F]" />
                Filières ({filieres.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {filieres.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Aucune filière enregistrée.</p>
              ) : (
                <div className="space-y-2">
                  {filieres.map((filiere) => (
                    <div
                      key={filiere.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-[#B91C2F]/10 flex items-center justify-center">
                          <BookOpen className="w-3.5 h-3.5 text-[#B91C2F]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{filiere.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{filiere.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Frais totaux</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {new Intl.NumberFormat("fr-FR").format(filiere.totalFees)} FCFA
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
