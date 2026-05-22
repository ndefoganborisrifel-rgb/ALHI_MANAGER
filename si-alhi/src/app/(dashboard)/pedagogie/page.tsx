import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default async function PedagogiePage() {
  const [filieres, schedules, rooms] = await Promise.all([
    prisma.filiere.findMany(),
    prisma.schedule.findMany({
      include: {
        courseAssignment: { include: { course: true, teacher: true } },
        room: true,
        filiere: true,
      },
      where: { academicYear: "2025-2026", semester: 1 },
      orderBy: { dayOfWeek: "asc" },
    }),
    prisma.room.findMany(),
  ]);

  const days = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
  const dayLabels: Record<string, string> = {
    LUNDI: "Lundi", MARDI: "Mardi", MERCREDI: "Mercredi",
    JEUDI: "Jeudi", VENDREDI: "Vendredi", SAMEDI: "Samedi",
  };

  // Detect collisions (same room, same time slot, same day)
  const collisions: Set<string> = new Set();
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i];
      const b = schedules[j];
      if (a.dayOfWeek === b.dayOfWeek && a.roomId === b.roomId && a.startTime === b.startTime) {
        collisions.add(a.id);
        collisions.add(b.id);
      }
    }
  }

  const morningSchedules = schedules.filter((s) => s.startTime < "12:00");
  const afternoonSchedules = schedules.filter((s) => s.startTime >= "13:00");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SI-Pédagogie</h1>
          <p className="text-gray-500 text-sm">Emploi du temps 2025-2026, Semestre 1</p>
        </div>
        {collisions.size > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">{collisions.size / 2} collision(s) détectée(s)</span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{schedules.length}</p>
          <p className="text-xs text-gray-500 mt-1">Créneaux planifiés</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-[#B91C2F]">{collisions.size > 0 ? collisions.size / 2 : 0}</p>
          <p className="text-xs text-gray-500 mt-1">Collisions</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{rooms.length}</p>
          <p className="text-xs text-gray-500 mt-1">Salles disponibles</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{filieres.length}</p>
          <p className="text-xs text-gray-500 mt-1">Filières</p>
        </CardContent></Card>
      </div>

      {/* Timetable Grid */}
      <Card>
        <CardHeader><CardTitle>Emploi du temps — Prépa Ingénieur (Semaine type)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 p-3 text-left text-gray-600 w-28">Horaire</th>
                {days.map((d) => (
                  <th key={d} className="border border-gray-200 p-3 text-center text-gray-600 min-w-32">{dayLabels[d]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Morning 8h-12h */}
              <tr>
                <td className="border border-gray-200 p-2 bg-gray-50 text-xs text-gray-500 font-medium">
                  <div>8h00 - 12h00</div>
                  <div className="text-gray-400">(4h)</div>
                </td>
                {days.map((day) => {
                  const slot = morningSchedules.find(
                    (s) => s.dayOfWeek === day && s.filiere.code === "ING"
                  );
                  const hasCollision = slot && collisions.has(slot.id);
                  return (
                    <td key={day} className={`border border-gray-200 p-2 align-top ${hasCollision ? "bg-red-50" : ""}`}>
                      {slot && slot.courseAssignment ? (
                        <div className={`rounded-lg p-2 text-xs ${hasCollision ? "bg-red-100 border border-red-300" : "bg-blue-50 border border-blue-200"}`}>
                          {hasCollision && <div className="text-red-600 font-bold mb-1">⚠️ Collision</div>}
                          <div className="font-semibold text-gray-800 leading-tight">{slot.courseAssignment.course.name}</div>
                          {slot.sessionNumber && <div className="text-gray-500 mt-0.5">({slot.sessionNumber}/{slot.totalSessions})</div>}
                          {slot.room && <div className="text-gray-600 mt-0.5 font-medium">📍 {slot.room.name}</div>}
                          <div className="text-gray-500">{slot.courseAssignment.teacher.lastName}</div>
                        </div>
                      ) : slot && slot.type === "EVALUATION" ? (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs">
                          <div className="font-semibold text-orange-700">Évaluation</div>
                        </div>
                      ) : slot && slot.type === "TPE" ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs">
                          <div className="font-semibold text-green-700">TPE</div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-300 py-2">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
              {/* Pause */}
              <tr className="bg-orange-50">
                <td colSpan={7} className="border border-gray-200 p-2 text-center text-sm font-medium text-orange-700">
                  ☕ PAUSE — 12h00 à 13h15
                </td>
              </tr>
              {/* Afternoon 13h20-17h20 */}
              <tr>
                <td className="border border-gray-200 p-2 bg-gray-50 text-xs text-gray-500 font-medium">
                  <div>13h20 - 17h20</div>
                  <div className="text-gray-400">(4h)</div>
                </td>
                {days.map((day) => {
                  const slot = afternoonSchedules.find(
                    (s) => s.dayOfWeek === day && s.filiere.code === "ING"
                  );
                  const hasCollision = slot && collisions.has(slot.id);
                  return (
                    <td key={day} className={`border border-gray-200 p-2 align-top ${hasCollision ? "bg-red-50" : ""}`}>
                      {slot && slot.courseAssignment ? (
                        <div className={`rounded-lg p-2 text-xs ${hasCollision ? "bg-red-100 border border-red-300" : "bg-purple-50 border border-purple-200"}`}>
                          {hasCollision && <div className="text-red-600 font-bold mb-1">⚠️ Collision</div>}
                          <div className="font-semibold text-gray-800 leading-tight">{slot.courseAssignment.course.name}</div>
                          {slot.sessionNumber && <div className="text-gray-500 mt-0.5">({slot.sessionNumber}/{slot.totalSessions})</div>}
                          {slot.room && <div className="text-gray-600 mt-0.5 font-medium">📍 {slot.room.name}</div>}
                          <div className="text-gray-500">{slot.courseAssignment.teacher.lastName}</div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-300 py-2">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
