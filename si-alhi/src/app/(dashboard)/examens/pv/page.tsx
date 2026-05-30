import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer } from "lucide-react";
import { CoursePvToggle } from "@/components/ui/CoursePvToggle";
import { PageHeader } from "@/components/ui/PageUI";

const ALLOWED_ROLES = ["ADMIN", "SCOLARITE", "ENSEIGNANT"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export default async function PVListPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as string;
  if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
    redirect("/dashboard");
  }

  const filieres = await prisma.filiere.findMany({
    orderBy: { name: "asc" },
    include: {
      courses: {
        orderBy: [{ semester: "asc" }, { code: "asc" }],
        include: { ue: true },
      },
    },
  });

  const currentYear = "2025-2026";

  return (
    <div className="space-y-6" style={{ maxWidth: "1200px" }}>
      <PageHeader
        title="Proces-Verbaux de Notes"
        subtitle={`PV officiel par filiere : toutes les matieres et tous les etudiants. Annee ${currentYear}.`}
        backHref="/examens"
        icon={<FileText style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
      />

      <div style={{ padding: "12px 16px", background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "12px", color: "var(--text-muted)" }}>
        Les boutons <strong style={{ color: "var(--text)" }}>PV Normale/Rattrapage</strong> ouvrent le proces-verbal complet de la filiere (toutes les matieres, tous les etudiants, notes et decision) pret a imprimer. Utilisez les boutons <strong style={{ color: "var(--text)" }}>Publier</strong> pour rendre les notes de chaque cours visibles aux etudiants.
      </div>

      {filieres.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Aucune filiere trouvee.
          </CardContent>
        </Card>
      )}

      {filieres.map((filiere) => (
        <Card key={filiere.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-3 flex-wrap">
              <span
                style={{
                  background: "#B91C2F",
                  color: "white",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                }}
              >
                {filiere.code}
              </span>
              {filiere.name}
              <span className="text-xs font-normal text-gray-400">
                {filiere.courses.length} cours
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Link
                  href={`/print/pv-filiere/${filiere.id}?session=NORMALE&year=${currentYear}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 border-gray-300 hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
                  >
                    <Printer className="w-3 h-3" />
                    PV Normale
                  </Button>
                </Link>
                <Link
                  href={`/print/pv-filiere/${filiere.id}?session=RATTRAPAGE&year=${currentYear}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 border-[#B91C2F]/40 text-[#B91C2F] hover:bg-[#B91C2F] hover:text-white hover:border-[#B91C2F]"
                  >
                    <Printer className="w-3 h-3" />
                    PV Rattrapage
                  </Button>
                </Link>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filiere.courses.length === 0 ? (
              <p className="px-6 pb-4 text-sm text-gray-400 italic">
                Aucun cours dans cette filiere.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cours</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sem.</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Publier Normale</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Publier Rattrapage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filiere.courses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {course.code}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{course.name}</div>
                          {course.ue && (
                            <div className="text-xs text-gray-400 mt-0.5">UE : {course.ue.code}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">S{course.semester}</td>
                        <td className="px-4 py-3 text-center">
                          <CoursePvToggle
                            courseId={course.id}
                            session="NORMALE"
                            initialPublished={course.pvNormalePublished}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <CoursePvToggle
                            courseId={course.id}
                            session="RATTRAPAGE"
                            initialPublished={course.pvRattrapagePublished}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
