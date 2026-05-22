import { Users, GraduationCap, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCFA, getStatusColor, getStatusLabel } from "@/lib/utils";

interface AdminDashboardProps {
  studentCount: number;
  teacherCount: number;
  totalCollected: number;
  recentStudents: { id: string; name: string; matricule: string; filiere: string; status: string }[];
}

export function AdminDashboard({ studentCount, teacherCount, totalCollected, recentStudents }: AdminDashboardProps) {
  const kpis = [
    { label: "Étudiants actifs", value: studentCount, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Enseignants", value: teacherCount, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "Recettes collectées", value: formatCFA(totalCollected), icon: TrendingUp, color: "text-[#B91C2F]", bg: "bg-red-50", isText: true },
    { label: "Alertes actives", value: 3, icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Africa Leadership Higher Institute — Année 2025-2026</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{kpi.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>
                      {kpi.isText ? kpi.value : kpi.value.toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${kpi.bg}`}>
                    <Icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Students */}
      <Card>
        <CardHeader>
          <CardTitle>Dernières inscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentStudents.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Aucun étudiant récent</p>
            )}
            {recentStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.matricule} — {student.filiere}</p>
                </div>
                <Badge className={getStatusColor(student.status)}>{getStatusLabel(student.status)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
