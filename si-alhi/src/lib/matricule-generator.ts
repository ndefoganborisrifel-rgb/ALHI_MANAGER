import { prisma } from "./prisma";

export async function generateMatricule(filiereCode: string, year?: number): Promise<string> {
  const currentYear = year ?? new Date().getFullYear();
  const yearSuffix = String(currentYear).slice(-2);

  const prefix = `ALI/${filiereCode}`;
  const existingStudents = await prisma.student.count({
    where: {
      matricule: { startsWith: prefix },
      promotionYear: currentYear,
    },
  });

  const seq = existingStudents + 1;
  const seqPadded = String(seq).padStart(3, "0");
  return `${prefix}${seqPadded}/${yearSuffix}`;
}
