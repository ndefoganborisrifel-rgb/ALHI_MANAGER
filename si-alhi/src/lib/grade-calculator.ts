export function calculateFinalGrade(cc1?: number | null, cc2?: number | null, exam?: number | null, rattrapage?: number | null): number | null {
  if (rattrapage != null) return rattrapage;
  if (cc1 != null && cc2 != null && exam != null) {
    return cc1 * 0.2 + cc2 * 0.2 + exam * 0.6;
  }
  if (cc1 != null && exam != null) {
    return cc1 * 0.4 + exam * 0.6;
  }
  if (exam != null) return exam;
  return null;
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

export function isValidated(grade: number | null): boolean {
  return grade != null && grade >= 10;
}
