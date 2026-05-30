// Formule : Moy(CC) * 50% + Examen * 50%.
//   - 2 CC : (CC1 + CC2) / 2 * 50% + Exam * 50%  =  CC1*25% + CC2*25% + Exam*50%
//   - 1 CC : CC1 * 50% + Exam * 50%
//   - aucun CC : note d'examen seule
//   Le rattrapage remplace la note d'examen; les CC de la session normale sont conserves.
export function calculateFinalGrade(cc1?: number | null, cc2?: number | null, exam?: number | null, rattrapage?: number | null): number | null {
  const effectiveExam = rattrapage != null ? rattrapage : exam;
  if (effectiveExam == null) return null;
  if (cc1 != null && cc2 != null) return cc1 * 0.25 + cc2 * 0.25 + effectiveExam * 0.5;
  if (cc1 != null) return cc1 * 0.5 + effectiveExam * 0.5;
  return effectiveExam;
}

export function calculateUEAverage(grades: Array<{ noteFinal: number | null; credits: number }>): number | null {
  const validGrades = grades.filter((g) => g.noteFinal != null);
  if (validGrades.length === 0) return null;

  const totalCredits = validGrades.reduce((sum, g) => sum + g.credits, 0);
  const weightedSum = validGrades.reduce((sum, g) => sum + (g.noteFinal! * g.credits), 0);
  return totalCredits > 0 ? weightedSum / totalCredits : null;
}

export function calculateGeneralAverage(ueAverages: Array<{ average: number | null; credits: number }>): number | null {
  const valid = ueAverages.filter((u) => u.average != null);
  if (valid.length === 0) return null;

  const totalCredits = valid.reduce((sum, u) => sum + u.credits, 0);
  const weightedSum = valid.reduce((sum, u) => sum + (u.average! * u.credits), 0);
  return totalCredits > 0 ? weightedSum / totalCredits : null;
}

export function getMention(average: number | null): string {
  if (average == null) return "En attente";
  if (average >= 16) return "Très Bien";
  if (average >= 14) return "Bien";
  if (average >= 12) return "Assez Bien";
  if (average >= 10) return "Passable";
  return "Insuffisant";
}

// ALHI valide a partir de 14/20
export function isValidated(grade: number | null): boolean {
  return grade != null && grade >= 14;
}
