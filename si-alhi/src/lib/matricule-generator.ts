import { prisma } from "./prisma";

const FILIERE_CODE_MAP: Record<string, string> = {
  PE: "ING",
  PB: "BUS",
  MBA: "MBA",
  BBA: "BBA",
};

export async function generateMatricule(filiereCode: string, year?: number): Promise<string> {
  const now = new Date();
  const academicStartYear = year ?? (now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1);
  const yearSuffix = String(academicStartYear).slice(-2);
  const matriculeCode = FILIERE_CODE_MAP[filiereCode] ?? filiereCode;

  const filiere = await prisma.filiere.findUnique({ where: { code: filiereCode } });
  const count = filiere
    ? await prisma.student.count({ where: { filiereId: filiere.id, promotionYear: academicStartYear } })
    : 0;

  const seq = count + 1;
  return `ALI/${matriculeCode}${String(seq).padStart(3, "0")}/${yearSuffix}`;
}
