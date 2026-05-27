import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateUEAverage, calculateGeneralAverage, getMention, isValidated } from "@/lib/grade-calculator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const semester = parseInt(searchParams.get("semester") ?? "1");
  const academicYear = searchParams.get("year") ?? "2025-2026";

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      filiere: {
        include: {
          ues: {
            include: { courses: true },
            where: { semester },
          },
        },
      },
      grades: {
        where: { academicYear, semester },
        include: { course: true },
      },
    },
  });

  if (!student) return NextResponse.json({ error: "Etudiant introuvable" }, { status: 404 });

  // Access control: a student can only view their own bulletin, and only if published
  if (session.user.role === "ETUDIANT") {
    if (session.user.id !== student.userId) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
    if (!student.filiere.bulletinsPublished) {
      return NextResponse.json({ error: "Les bulletins ne sont pas encore disponibles. Attendez l'autorisation de la direction." }, { status: 403 });
    }
  }

  // A parent can only view bulletins of their children
  if (session.user.role === "PARENT") {
    const parent = await prisma.parent.findFirst({
      where: { userId: session.user.id, students: { some: { id } } },
    });
    if (!parent) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    if (!student.filiere.bulletinsPublished) {
      return NextResponse.json({ error: "Les bulletins ne sont pas encore disponibles." }, { status: 403 });
    }
  }

  // Build bulletin structure
  const ueResults = student.filiere.ues.map((ue) => {
    const courseGrades = ue.courses.map((course) => {
      const grade = student.grades.find((g) => g.courseId === course.id);
      return {
        code: course.code,
        name: course.name,
        credits: course.credits,
        cc1: grade?.cc1 ?? null,
        cc2: grade?.cc2 ?? null,
        examScore: grade?.examScore ?? null,
        noteFinal: grade?.noteFinal ?? null,
        session: grade?.session ?? "NORMALE",
        validated: isValidated(grade?.noteFinal ?? null),
      };
    });

    const ueAvg = calculateUEAverage(
      courseGrades.map((g) => ({ noteFinal: g.noteFinal, credits: g.credits }))
    );
    const totalCredits = courseGrades.reduce((sum, g) => sum + g.credits, 0);
    const validatedCredits = courseGrades
      .filter((g) => g.validated)
      .reduce((sum, g) => sum + g.credits, 0);

    return {
      ueCode: ue.code,
      ueName: ue.name,
      courses: courseGrades,
      average: ueAvg,
      totalCredits,
      validatedCredits,
    };
  });

  const generalAverage = calculateGeneralAverage(
    ueResults.map((ue) => ({ average: ue.average, credits: ue.totalCredits }))
  );
  const totalValidatedCredits = ueResults.reduce((sum, ue) => sum + ue.validatedCredits, 0);
  const mention = getMention(generalAverage);

  // Get rank among all students in same filiere using proper credit weights
  const allStudents = await prisma.student.findMany({
    where: { filiereId: student.filiereId, status: { in: ["ACTIF", "INSCRIT"] } },
    include: { grades: { where: { academicYear, semester }, include: { course: true } } },
  });

  const avgList = allStudents.map((s) => ({
    id: s.id,
    avg: calculateGeneralAverage(s.grades.map((g) => ({ average: g.noteFinal, credits: g.course.credits }))),
  }));
  const sortedAvgs = avgList.sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  const rank = sortedAvgs.findIndex((a) => a.id === id) + 1;

  return NextResponse.json({
    student: {
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      matricule: student.matricule,
      level: student.level,
      major: student.filiere.name,
    },
    academicYear,
    semester,
    ueResults,
    generalAverage,
    totalValidatedCredits,
    totalCredits: ueResults.reduce((sum, ue) => sum + ue.totalCredits, 0),
    mention,
    rank: `${rank}${rank === 1 ? "er" : "ème"}`,
    decision: generalAverage != null && generalAverage >= 10 ? "Admis" : "Ajourné",
  });
}
