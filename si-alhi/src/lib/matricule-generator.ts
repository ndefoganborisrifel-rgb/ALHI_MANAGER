import { prisma } from "./prisma";

// Codes de filiere -> prefixe du matricule
const FILIERE_CODE_MAP: Record<string, string> = {
  PE: "ING",
  GI: "ING",
  ING: "ING",
  GENIE: "ING",
  GC: "ING",
  PB: "BUS",
  BUS: "BUS",
  MBA: "MBA",
  BBA: "BBA",
  GRH: "GRH",
  COMPTA: "CPT",
  FIN: "FIN",
  MKT: "MKT",
  INFO: "INFO",
  TELECOM: "TLC",
  DROIT: "DRT",
  AGRO: "AGR",
};

export function buildMatriculeCode(filiereCode: string): string {
  const upper = filiereCode.toUpperCase();
  // Recherche exacte
  if (FILIERE_CODE_MAP[upper]) return FILIERE_CODE_MAP[upper];
  // Recherche partielle (si le code contient une cle connue)
  for (const [key, val] of Object.entries(FILIERE_CODE_MAP)) {
    if (upper.includes(key)) return val;
  }
  // Retourne le code brut tronque a 3 chars en majuscule
  return upper.slice(0, 3);
}

export async function generateMatricule(filiereCode: string, year?: number): Promise<string> {
  const now = new Date();
  const academicStartYear = year ?? (now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1);
  const yearSuffix = String(academicStartYear).slice(-2);
  const matriculeCode = buildMatriculeCode(filiereCode);

  const filiere = await prisma.filiere.findUnique({ where: { code: filiereCode } });
  const count = filiere
    ? await prisma.student.count({ where: { filiereId: filiere.id, promotionYear: academicStartYear } })
    : 0;

  const seq = count + 1;
  return `ALI\\${matriculeCode}${String(seq).padStart(3, "0")}\\${yearSuffix}`;
}
