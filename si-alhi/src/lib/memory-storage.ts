import path from "path";

// Dossier de stockage hors de public/ : les fichiers ajoutes a chaud ne sont
// pas servis par Next en production, on les sert via /api/memory/[id]/image.
export const MEMORY_DIR = path.join(process.cwd(), "uploads", "memory");
