// Les filieres anglophones (BBA, MBA) recoivent leurs documents officiels
// en anglais : recu, bulletin, emploi du temps, planning des evaluations.
export function isEnglishFiliere(code?: string | null, name?: string | null): boolean {
  const hay = `${code ?? ""} ${name ?? ""}`.toUpperCase();
  return hay.includes("BBA") || hay.includes("MBA");
}
