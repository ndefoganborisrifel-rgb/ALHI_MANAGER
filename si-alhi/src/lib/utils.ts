import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("fr-FR");
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function generateReceiptNumber(year: number, seq: number): string {
  return `REC-${year}-${String(seq).padStart(5, "0")}`;
}

export function getMentionFromAverage(avg: number): string {
  if (avg >= 16) return "Très Bien";
  if (avg >= 14) return "Bien";
  if (avg >= 12) return "Assez Bien";
  if (avg >= 10) return "Passable";
  return "Insuffisant";
}

export function getMentionColor(avg: number): string {
  if (avg >= 16) return "text-amber-600";
  if (avg >= 14) return "text-green-600";
  if (avg >= 12) return "text-blue-600";
  if (avg >= 10) return "text-gray-600";
  return "text-red-600";
}

export function isAdmis(avg: number): boolean {
  return avg >= 10;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PROSPECT: "Prospect",
    DOSSIER_RECU: "Dossier reçu",
    ENTRETIEN: "Entretien",
    ACCEPTE: "Accepté",
    INSCRIT: "Inscrit",
    ACTIF: "Actif",
    SUSPENDU: "Suspendu",
    DIPLOME: "Diplômé",
    EN_ATTENTE: "En attente",
    VALIDE: "Validé",
    ANNULE: "Annulé",
    FONCTIONNEL: "Fonctionnel",
    EN_PANNE: "En panne",
    EN_MAINTENANCE: "En maintenance",
    REFORME: "Réformé",
    EN_RECHERCHE: "En recherche",
    CONVENTION_SIGNEE: "Convention signée",
    EN_COURS: "En cours",
    TERMINE: "Terminé",
    SOUTENU: "Soutenu",
    BROUILLON: "Brouillon",
    PAYE: "Payé",
    PERMANENT: "Permanent",
    VACATAIRE: "Vacataire",
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIF: "bg-green-100 text-green-800",
    INSCRIT: "bg-blue-100 text-blue-800",
    ACCEPTE: "bg-emerald-100 text-emerald-800",
    ENTRETIEN: "bg-yellow-100 text-yellow-800",
    DOSSIER_RECU: "bg-orange-100 text-orange-800",
    PROSPECT: "bg-gray-100 text-gray-800",
    SUSPENDU: "bg-red-100 text-red-800",
    DIPLOME: "bg-purple-100 text-purple-800",
    VALIDE: "bg-green-100 text-green-800",
    EN_ATTENTE: "bg-yellow-100 text-yellow-800",
    ANNULE: "bg-red-100 text-red-800",
    FONCTIONNEL: "bg-green-100 text-green-800",
    EN_PANNE: "bg-red-100 text-red-800",
    EN_MAINTENANCE: "bg-yellow-100 text-yellow-800",
    REFORME: "bg-gray-100 text-gray-800",
    PAYE: "bg-green-100 text-green-800",
    BROUILLON: "bg-gray-100 text-gray-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}
