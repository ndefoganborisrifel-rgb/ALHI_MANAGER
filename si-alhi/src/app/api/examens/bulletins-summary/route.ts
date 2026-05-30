import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateGeneralAverage, getMention } from "@/lib/grade-calculator";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE", "ENSEIGNANT"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filiereId = searchParams.get("filiereId");
  const semester = parseInt(searchParams.get("semester") ?? "1");
  const academicYear = searchParams.get("year") ?? "2025-2026";

  const students = await prisma.student.findMany({
    where: {
      status: { in: ["ACTIF", "INSCRIT"] },
      ...(filiereId ? { filiereId } : {}),
    },
    include: {
      grades: {
        where: { academicYear, semester },
        include: { course: true },
      },
    },
    orderBy: { lastName: "asc" },
  });

  const result = students.map((student) => {
    const gradeItems = student.grades.map((g) => ({
      average: g.noteFinal,
      credits: g.course.credits,
    }));
    const avg = calculateGeneralAverage(gradeItems);
    const credits = student.grades
      .filter((g) => (g.noteFinal ?? 0) >= 14)
      .reduce((sum, g) => sum + g.course.credits, 0);

    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      matricule: student.matricule,
      avg,
      credits,
      mention: getMention(avg),
    };
  });

  return NextResponse.json(result);
}
