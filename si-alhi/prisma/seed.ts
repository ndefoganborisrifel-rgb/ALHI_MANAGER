import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hash } from "bcryptjs";
import path from "path";

const dbPath = `file:${path.resolve(process.cwd(), "dev.db")}`;
const adapter = new PrismaLibSql({ url: dbPath });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const ECHEANCIER_PE_PB = JSON.stringify([
  { type: "INSCRIPTION", amount: 250000, dueDate: "2025-09-15", label: "Frais d'inscription" },
  { type: "TRANCHE1",    amount: 400000, dueDate: "2025-09-30", label: "1ère tranche" },
  { type: "TRANCHE2",    amount: 350000, dueDate: "2025-12-10", label: "2ème tranche" },
  { type: "TRANCHE3",    amount: 300000, dueDate: "2026-02-10", label: "3ème tranche" },
  { type: "TRANCHE4",    amount: 200000, dueDate: "2026-04-10", label: "4ème tranche" },
]);

const ECHEANCIER_MBA_BBA = JSON.stringify([
  { type: "INSCRIPTION", amount: 284000, dueDate: "2025-09-15", label: "Frais d'inscription" },
  { type: "TRANCHE1",    amount: 454000, dueDate: "2025-09-30", label: "1ère tranche" },
  { type: "TRANCHE2",    amount: 397000, dueDate: "2025-12-10", label: "2ème tranche" },
  { type: "TRANCHE3",    amount: 340000, dueDate: "2026-02-10", label: "3ème tranche" },
  { type: "TRANCHE4",    amount: 225000, dueDate: "2026-04-10", label: "4ème tranche" },
]);

async function main() {
  console.log("🌱 Seeding database...");

  // Academic Years
  await prisma.academicYear.upsert({
    where: { label: "2024-2025" },
    update: {},
    create: { label: "2024-2025", startDate: new Date("2024-09-01"), endDate: new Date("2025-07-31"), isCurrent: false },
  });
  await prisma.academicYear.upsert({
    where: { label: "2025-2026" },
    update: { isCurrent: true },
    create: { label: "2025-2026", startDate: new Date("2025-09-01"), endDate: new Date("2026-07-31"), isCurrent: true },
  });
  console.log("✅ Academic years created");

  // Filières — 4 programmes officiels ALHI
  const [filierePE, filierePB, filiereMBA, filiereBBA] = await Promise.all([
    prisma.filiere.upsert({
      where: { code: "PE" },
      update: { name: "Prépas Ingénieur", totalFees: 1500000 },
      create: { code: "PE", name: "Prépas Ingénieur", description: "Préparatoire aux grandes écoles d'ingénierie et technologies", duration: 2, totalFees: 1500000 },
    }),
    prisma.filiere.upsert({
      where: { code: "PB" },
      update: { name: "Prépas Business", totalFees: 1500000 },
      create: { code: "PB", name: "Prépas Business", description: "Préparatoire management, entrepreneuriat et commerce", duration: 2, totalFees: 1500000 },
    }),
    prisma.filiere.upsert({
      where: { code: "MBA" },
      update: { name: "MBA", totalFees: 1700000 },
      create: { code: "MBA", name: "MBA", description: "Master in Business Administration", duration: 2, totalFees: 1700000 },
    }),
    prisma.filiere.upsert({
      where: { code: "BBA" },
      update: { name: "BBA", totalFees: 1700000 },
      create: { code: "BBA", name: "BBA", description: "Bachelor in Business Administration", duration: 3, totalFees: 1700000 },
    }),
  ]);
  console.log("✅ Filières created");

  // Specializations for PE
  const specsIngData = [
    { id: "spec-pe-gc",  name: "Génie Civil" },
    { id: "spec-pe-ds",  name: "Data Science" },
    { id: "spec-pe-gi",  name: "Génie Informatique" },
    { id: "spec-pe-ge",  name: "Génie Électrique" },
    { id: "spec-pe-gm",  name: "Génie Mécanique" },
  ];
  const specsIng: { id: string }[] = [];
  for (const s of specsIngData) {
    const spec = await prisma.specialization.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, name: s.name, filiereId: filierePE.id },
    });
    specsIng.push(spec);
  }

  // Specializations for PB
  const specsPBData = [
    { id: "spec-pb-mk",  name: "Marketing & Communication" },
    { id: "spec-pb-fin", name: "Finance & Comptabilité" },
    { id: "spec-pb-rh",  name: "Ressources Humaines" },
    { id: "spec-pb-ci",  name: "Commerce International" },
  ];
  for (const s of specsPBData) {
    await prisma.specialization.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, name: s.name, filiereId: filierePB.id },
    });
  }
  console.log("✅ Specializations created");

  // UEs and Courses for PE filière (Prépa Engineering — Semestre 1)
  const ueB101 = await prisma.uE.upsert({
    where: { code_filiereId: { code: "B101", filiereId: filierePE.id } },
    update: {},
    create: { code: "B101", name: "MATHÉMATIQUES APPLIQUÉES", filiereId: filierePE.id, semester: 1, totalCredits: 9 },
  });
  const ueB102 = await prisma.uE.upsert({
    where: { code_filiereId: { code: "B102", filiereId: filierePE.id } },
    update: {},
    create: { code: "B102", name: "DÉVELOPPEMENT & TECHNOLOGIE DU WEB", filiereId: filierePE.id, semester: 1, totalCredits: 12 },
  });
  const ueB103 = await prisma.uE.upsert({
    where: { code_filiereId: { code: "B103", filiereId: filierePE.id } },
    update: {},
    create: { code: "B103", name: "TECHNIQUES TRANSVERSALES ET DE PROFESSIONNALISATION", filiereId: filierePE.id, semester: 1, totalCredits: 9 },
  });
  console.log("✅ UEs created");

  const coursesData = [
    { code: "B1011", name: "Algèbre Linéaire", credits: 4, totalHours: 40, ueCode: "B101", ueName: "MATHÉMATIQUES APPLIQUÉES", ueId: ueB101.id },
    { code: "B1012", name: "Mathématiques (Statistiques descriptives)", credits: 3, totalHours: 30, ueCode: "B101", ueName: "MATHÉMATIQUES APPLIQUÉES", ueId: ueB101.id },
    { code: "B1013", name: "Chimie Générale", credits: 2, totalHours: 20, ueCode: "B101", ueName: "MATHÉMATIQUES APPLIQUÉES", ueId: ueB101.id },
    { code: "B1021", name: "Bases de données et langage SQL (initiation)", credits: 2, totalHours: 20, ueCode: "B102", ueName: "DÉVELOPPEMENT & TECHNOLOGIE DU WEB", ueId: ueB102.id },
    { code: "B1022", name: "Algorithmique", credits: 4, totalHours: 40, ueCode: "B102", ueName: "DÉVELOPPEMENT & TECHNOLOGIE DU WEB", ueId: ueB102.id },
    { code: "B1023", name: "Développement VBA Excel", credits: 2, totalHours: 20, ueCode: "B102", ueName: "DÉVELOPPEMENT & TECHNOLOGIE DU WEB", ueId: ueB102.id },
    { code: "B1024", name: "Architecture web", credits: 2, totalHours: 20, ueCode: "B102", ueName: "DÉVELOPPEMENT & TECHNOLOGIE DU WEB", ueId: ueB102.id },
    { code: "B1025", name: "Circuits logiques et Architecture d'un ordinateur", credits: 2, totalHours: 20, ueCode: "B102", ueName: "DÉVELOPPEMENT & TECHNOLOGIE DU WEB", ueId: ueB102.id },
    { code: "B1031", name: "Principe de socialisation", credits: 2, totalHours: 20, ueCode: "B103", ueName: "TECHNIQUES TRANSVERSALES ET DE PROFESSIONNALISATION", ueId: ueB103.id },
    { code: "B1032", name: "Leadership et Entrepreneuriat", credits: 1, totalHours: 10, ueCode: "B103", ueName: "TECHNIQUES TRANSVERSALES ET DE PROFESSIONNALISATION", ueId: ueB103.id },
    { code: "B1033", name: "Communication d'entreprise", credits: 1, totalHours: 10, ueCode: "B103", ueName: "TECHNIQUES TRANSVERSALES ET DE PROFESSIONNALISATION", ueId: ueB103.id },
    { code: "B1034", name: "Projet tutoré N°1 : Application de gestion de notes", credits: 3, totalHours: 30, ueCode: "B103", ueName: "TECHNIQUES TRANSVERSALES ET DE PROFESSIONNALISATION", ueId: ueB103.id },
    { code: "B1035", name: "Initiation au TOEIC", credits: 2, totalHours: 20, ueCode: "B103", ueName: "TECHNIQUES TRANSVERSALES ET DE PROFESSIONNALISATION", ueId: ueB103.id },
  ];

  const courses: Record<string, { id: string }> = {};
  for (const c of coursesData) {
    const course = await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: { ...c, filiereId: filierePE.id, semester: 1 },
    });
    courses[c.code] = course;
  }
  console.log("✅ Courses created");

  // Rooms
  const roomsData = [
    { code: "AMPHI-A",   name: "Amphithéâtre A",       capacity: 200, building: "Bâtiment Principal", floor: "RDC",  hasProjector: true,  hasComputers: false },
    { code: "AMPHI-B",   name: "Amphithéâtre B",       capacity: 150, building: "Bâtiment Principal", floor: "1er",  hasProjector: true,  hasComputers: false },
    { code: "INFO-1",    name: "Salle Informatique 1", capacity: 30,  building: "Bâtiment Tech",       floor: "RDC",  hasProjector: true,  hasComputers: true  },
    { code: "INFO-2",    name: "Salle Informatique 2", capacity: 25,  building: "Bâtiment Tech",       floor: "1er",  hasProjector: true,  hasComputers: true  },
    { code: "COURS-B1",  name: "Salle de Cours B1",   capacity: 40,  building: "Bâtiment B",           floor: "RDC",  hasProjector: true,  hasComputers: false },
    { code: "COURS-B2",  name: "Salle de Cours B2",   capacity: 40,  building: "Bâtiment B",           floor: "1er",  hasProjector: false, hasComputers: false },
    { code: "COURS-B3",  name: "Salle de Cours B3",   capacity: 35,  building: "Bâtiment B",           floor: "2ème", hasProjector: true,  hasComputers: false },
    { code: "CONF",      name: "Salle de Conférence", capacity: 60,  building: "Bâtiment Principal", floor: "2ème", hasProjector: true,  hasComputers: false },
  ];

  const rooms: Record<string, { id: string }> = {};
  for (const r of roomsData) {
    const room = await prisma.room.upsert({ where: { code: r.code }, update: {}, create: r });
    rooms[r.code] = room;
  }
  console.log("✅ Rooms created");

  // Users — Admin & Scolarité
  const adminPassword = await hash("Admin@2025", 12);
  await prisma.user.upsert({
    where: { email: "directrice@africaleadershipinstitute.com" },
    update: {},
    create: { email: "directrice@africaleadershipinstitute.com", password: adminPassword, firstName: "Directrice", lastName: "ALHI", role: "ADMIN", mustChangePassword: false },
  });

  const scolaritePassword = await hash("Scolarite@2025", 12);
  await prisma.user.upsert({
    where: { email: "scolarite@africaleadershipinstitute.com" },
    update: {},
    create: { email: "scolarite@africaleadershipinstitute.com", password: scolaritePassword, firstName: "Service", lastName: "Scolarité", role: "SCOLARITE", mustChangePassword: false },
  });

  // Teachers
  const teachersData = [
    { email: "obiang@africaleadershipinstitute.com",    firstName: "Dr.", lastName: "OBIANG",   speciality: "Microéconomie",                              type: "PERMANENT" as const, hourlyRate: 15000 },
    { email: "nkana@africaleadershipinstitute.com",     firstName: "M.",  lastName: "NKANA",    speciality: "Droit et Administration publique",            type: "VACATAIRE" as const, hourlyRate: 12000 },
    { email: "fouda@africaleadershipinstitute.com",     firstName: "Barthélémy", lastName: "FOUDA",    speciality: "Bases de données, Socialisation",     type: "VACATAIRE" as const, hourlyRate: 12000 },
    { email: "atangana@africaleadershipinstitute.com",  firstName: "Dr.", lastName: "ATANGANA", speciality: "Mathématiques",                              type: "PERMANENT" as const, hourlyRate: 15000 },
    { email: "mbarga@africaleadershipinstitute.com",    firstName: "Mme.",lastName: "MBARGA",   speciality: "Algorithmique",                              type: "VACATAIRE" as const, hourlyRate: 12000 },
    { email: "tchoupo@africaleadershipinstitute.com",   firstName: "M.",  lastName: "TCHOUPO",  speciality: "Architecture Web",                           type: "VACATAIRE" as const, hourlyRate: 12000 },
    { email: "beyala@africaleadershipinstitute.com",    firstName: "Dr.", lastName: "BEYALA",   speciality: "Communication",                              type: "PERMANENT" as const, hourlyRate: 15000 },
    { email: "onana@africaleadershipinstitute.com",     firstName: "M.",  lastName: "ONANA",    speciality: "Entrepreneuriat",                            type: "VACATAIRE" as const, hourlyRate: 10000 },
  ];

  const teacherUsers: Record<string, { id: string }> = {};
  const teacherPassword = await hash("Enseignant@2025", 12);
  for (const t of teachersData) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: { email: t.email, password: teacherPassword, firstName: t.firstName, lastName: t.lastName, role: "ENSEIGNANT", mustChangePassword: false },
    });
    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, firstName: t.firstName, lastName: t.lastName, email: t.email, speciality: t.speciality, type: t.type, hourlyRate: t.hourlyRate },
    });
    teacherUsers[t.lastName] = teacher;
  }
  console.log("✅ Teachers created");

  // Course assignments
  const assignments: Record<string, { id: string }> = {};
  const assignmentsData = [
    { courseCode: "B1011", teacherName: "ATANGANA" },
    { courseCode: "B1012", teacherName: "ATANGANA" },
    { courseCode: "B1013", teacherName: "ATANGANA" },
    { courseCode: "B1021", teacherName: "FOUDA" },
    { courseCode: "B1022", teacherName: "MBARGA" },
    { courseCode: "B1023", teacherName: "OBIANG" },
    { courseCode: "B1024", teacherName: "TCHOUPO" },
    { courseCode: "B1025", teacherName: "TCHOUPO" },
    { courseCode: "B1031", teacherName: "FOUDA" },
    { courseCode: "B1032", teacherName: "ONANA" },
    { courseCode: "B1033", teacherName: "BEYALA" },
    { courseCode: "B1034", teacherName: "FOUDA" },
    { courseCode: "B1035", teacherName: "NKANA" },
  ];

  for (const a of assignmentsData) {
    const teacher = teacherUsers[a.teacherName];
    if (!teacher || !courses[a.courseCode]) continue;
    const assignment = await prisma.courseAssignment.upsert({
      where: { courseId_teacherId_academicYear_semester: { courseId: courses[a.courseCode].id, teacherId: teacher.id, academicYear: "2025-2026", semester: 1 } },
      update: {},
      create: { courseId: courses[a.courseCode].id, teacherId: teacher.id, academicYear: "2025-2026", semester: 1 },
    });
    assignments[a.courseCode] = assignment;
  }
  console.log("✅ Course assignments created");

  // Schedules
  const schedulesData = [
    { courseCode: "B1011", day: "LUNDI",    start: "08:00", end: "12:00", room: "AMPHI-A",  session: 5, total: 9 },
    { courseCode: "B1012", day: "MARDI",    start: "08:00", end: "12:00", room: "COURS-B1", session: 6, total: 9 },
    { courseCode: "B1024", day: "MERCREDI", start: "08:00", end: "12:00", room: "INFO-1",   session: 2, total: 6 },
    { courseCode: "B1021", day: "JEUDI",    start: "08:00", end: "12:00", room: "INFO-2",   session: 4, total: 6 },
    { courseCode: "B1021", day: "VENDREDI", start: "08:00", end: "12:00", room: "INFO-2",   session: 5, total: 6 },
    { courseCode: "B1021", day: "LUNDI",    start: "13:20", end: "17:20", room: "INFO-1",   session: 3, total: 6 },
    { courseCode: "B1031", day: "JEUDI",    start: "13:20", end: "17:20", room: "COURS-B1", session: 3, total: 6 },
  ];

  for (const s of schedulesData) {
    const assignment = assignments[s.courseCode];
    const room = rooms[s.room];
    if (!assignment || !room) continue;
    await prisma.schedule.create({
      data: {
        courseAssignmentId: assignment.id,
        roomId: room.id,
        dayOfWeek: s.day as "LUNDI",
        startTime: s.start,
        endTime: s.end,
        academicYear: "2025-2026",
        semester: 1,
        filiereId: filierePE.id,
        type: "COURS",
        sessionNumber: s.session,
        totalSessions: s.total,
      },
    });
  }
  console.log("✅ Schedules created");

  // Helper pour créer les étudiants d'une filière avec le bon code matricule
  async function seedStudents(
    list: { lastName: string; firstName: string; gender: string }[],
    filiereId: string,
    matriculePrefix: string,  // ex: "ING", "BUS", "MBA", "BBA"
    specId?: string,
  ): Promise<{ id: string; firstName: string; lastName: string }[]> {
    const records: { id: string; firstName: string; lastName: string }[] = [];
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const seq = i + 1;
      const matricule = `ALI\\${matriculePrefix}${String(seq).padStart(3, "0")}\\25`;
      const slug = `${s.firstName.toLowerCase().replace(/\s+/g, ".").normalize("NFD").replace(/[̀-ͯ]/g, "")}.${s.lastName.toLowerCase().replace(/\s+/g, ".").normalize("NFD").replace(/[̀-ͯ]/g, "")}`;
      const email = `${slug}@etu.africaleadershipinstitute.com`;

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, password: studentPassword, firstName: s.firstName, lastName: s.lastName, role: "ETUDIANT", mustChangePassword: false },
      });

      const student = await prisma.student.upsert({
        where: { userId: user.id },
        update: { matricule, firstName: s.firstName, lastName: s.lastName },
        create: {
          userId: user.id, matricule, firstName: s.firstName, lastName: s.lastName,
          gender: s.gender, filiereId, specializationId: specId ?? null,
          promotionYear: 2025, level: 1, status: "ACTIF", city: "Yaoundé", email,
        },
      });
      records.push(student);
    }
    return records;
  }

  const studentPassword = await hash("Etudiant@2025", 12);

  // Prépas Ingénieur — ALI\ING001\25 … ALI\ING020\25
  const peStudentsData = [
    { lastName: "BINOUMA ASSOUNANA",    firstName: "Ange Jenny Willy",  gender: "F" },
    { lastName: "FOTIE MAMBOU DEFFO",   firstName: "Hilane",            gender: "F" },
    { lastName: "NDE FOGAN",            firstName: "Boris Rifel",       gender: "M" },
    { lastName: "NNAH VOULA",           firstName: "Clément Brady",     gender: "M" },
    { lastName: "OKALA MANGA",          firstName: "Junior Daryl",      gender: "M" },
    { lastName: "OLINGA INGONGOMO",     firstName: "Trésor",            gender: "M" },
    { lastName: "SAADI",                firstName: "Yannick Franck",    gender: "M" },
    { lastName: "TAMBOU SEGNOU",        firstName: "Junior",            gender: "M" },
    { lastName: "ATANGANA",             firstName: "Marie Claire",      gender: "F" },
    { lastName: "MBARGA NGONO",         firstName: "Paul Emmanuel",     gender: "M" },
    { lastName: "EKAMBI",               firstName: "Grace Bertille",    gender: "F" },
    { lastName: "NGASSAM",              firstName: "François Yves",     gender: "M" },
    { lastName: "TCHOUPO",              firstName: "Laure Divine",      gender: "F" },
    { lastName: "NKOULOU",              firstName: "Patrick Aurèle",    gender: "M" },
    { lastName: "MESSI",                firstName: "Christelle Ines",   gender: "F" },
    { lastName: "ABENA",                firstName: "Serge Armand",      gender: "M" },
    { lastName: "ONANA",                firstName: "Gaëlle Bérengère",  gender: "F" },
    { lastName: "BEYALA",               firstName: "Junior Christian",  gender: "M" },
    { lastName: "NTEP",                 firstName: "Audrey Noëlle",     gender: "F" },
    { lastName: "MBAPPÉ",               firstName: "David Sébastien",   gender: "M" },
  ];
  const studentRecords = await seedStudents(peStudentsData, filierePE.id, "ING", specsIng[0].id);

  // Prépas Business — ALI\BUS001\25 … ALI\BUS009\25
  const pbStudentsData = [
    { lastName: "KAMGA",       firstName: "Éric Donald",     gender: "M" },
    { lastName: "FOPA TAGNE",  firstName: "Carelle Lucie",   gender: "F" },
    { lastName: "NGUELE",      firstName: "Rodrigue Parfait",gender: "M" },
    { lastName: "BIKIÉ",       firstName: "Armelle Grace",   gender: "F" },
    { lastName: "NFONO",       firstName: "Thierry Blaise",  gender: "M" },
    { lastName: "DJOB",        firstName: "Célestine Aline", gender: "F" },
    { lastName: "OWONA",       firstName: "Franck Valery",   gender: "M" },
    { lastName: "MINKA",       firstName: "Laetitia Diane",  gender: "F" },
    { lastName: "ESSOMBA",     firstName: "Claude Arnaud",   gender: "M" },
  ];
  const pbStudentRecords = await seedStudents(pbStudentsData, filierePB.id, "BUS");

  // MBA — ALI\MBA001\25 … ALI\MBA006\25
  const mbaStudentsData = [
    { lastName: "BELINGA",     firstName: "Christophe Serge", gender: "M" },
    { lastName: "NZIÉ",        firstName: "Nadine Ornella",   gender: "F" },
    { lastName: "MVONDO",      firstName: "Hervé Stéphane",   gender: "M" },
    { lastName: "ABESSOLO",    firstName: "Régine Carole",    gender: "F" },
    { lastName: "OLOMO",       firstName: "Luc Bertrand",     gender: "M" },
    { lastName: "ETOGA",       firstName: "Sandrine Josée",   gender: "F" },
  ];
  const mbaStudentRecords = await seedStudents(mbaStudentsData, filiereMBA.id, "MBA");

  // BBA — ALI\BBA001\25 … ALI\BBA005\25
  const bbaStudentsData = [
    { lastName: "ONDOUA",      firstName: "Maëlle Ingrid",    gender: "F" },
    { lastName: "NKOUMOU",     firstName: "Ulric Fabrice",    gender: "M" },
    { lastName: "MEYE",        firstName: "Prisca Sandra",    gender: "F" },
    { lastName: "ZANGA",       firstName: "Bertrand Loïc",    gender: "M" },
    { lastName: "EBANG",       firstName: "Miroslava Chloe",  gender: "F" },
  ];
  const bbaStudentRecords = await seedStudents(bbaStudentsData, filiereBBA.id, "BBA");

  console.log("✅ Students created (PE: ING, PB: BUS, MBA: MBA, BBA: BBA)");

  // Grades — Boris Rifel NDE FOGAN (index 2) from prototype
  const borisStudent = studentRecords[2];
  const borisGrades = [
    { code: "B1011", cc1: 18,    cc2: null, exam: 18,    final: 18    },
    { code: "B1012", cc1: 18.5,  cc2: null, exam: 18.5,  final: 18.5  },
    { code: "B1013", cc1: 18,    cc2: null, exam: 18,    final: 18    },
    { code: "B1021", cc1: 18.25, cc2: null, exam: 18.25, final: 18.25 },
    { code: "B1022", cc1: 18,    cc2: null, exam: 18,    final: 18    },
    { code: "B1023", cc1: 15,    cc2: null, exam: 15,    final: 15    },
    { code: "B1024", cc1: 19.5,  cc2: null, exam: 19.5,  final: 19.5  },
    { code: "B1025", cc1: 16.75, cc2: null, exam: 16.75, final: 16.75 },
    { code: "B1031", cc1: 10,    cc2: 8.5,  exam: null,  final: 18.5  },
    { code: "B1032", cc1: 19,    cc2: null, exam: 19,    final: 19    },
    { code: "B1033", cc1: 18.5,  cc2: null, exam: 18.5,  final: 18.5  },
    { code: "B1034", cc1: 15,    cc2: null, exam: 15,    final: 15    },
    { code: "B1035", cc1: 16,    cc2: null, exam: 16,    final: 16    },
  ];

  for (const g of borisGrades) {
    const course = courses[g.code];
    if (!course) continue;
    await prisma.grade.upsert({
      where: { studentId_courseId_academicYear_semester_session: { studentId: borisStudent.id, courseId: course.id, academicYear: "2025-2026", semester: 1, session: "NORMALE" } },
      update: {},
      create: { studentId: borisStudent.id, courseId: course.id, cc1: g.cc1, cc2: g.cc2, examScore: g.exam, noteFinal: g.final, session: "NORMALE", academicYear: "2025-2026", semester: 1 },
    });
  }
  console.log("✅ Boris Rifel grades created");

  // Payments — échéancier correct
  const paymentData = [
    { student: studentRecords[0], amount: 250000, type: "INSCRIPTION" as const, method: "ESPECES" as const,      receiptNum: "REC-2025-00001", desc: "Frais d'inscription" },
    { student: studentRecords[0], amount: 400000, type: "TRANCHE1"    as const, method: "ORANGE_MONEY" as const, receiptNum: "REC-2025-00002", desc: "1ère tranche scolarité" },
    { student: studentRecords[1], amount: 250000, type: "INSCRIPTION" as const, method: "ESPECES" as const,      receiptNum: "REC-2025-00003", desc: "Frais d'inscription" },
    { student: borisStudent,      amount: 250000, type: "INSCRIPTION" as const, method: "ESPECES" as const,      receiptNum: "REC-2025-00028", desc: "Frais d'inscription" },
    { student: borisStudent,      amount: 400000, type: "TRANCHE1"    as const, method: "MTN_MOMO" as const,     receiptNum: "REC-2025-00029", desc: "1ère tranche scolarité" },
    { student: studentRecords[3], amount: 250000, type: "INSCRIPTION" as const, method: "VIREMENT" as const,     receiptNum: "REC-2025-00004", desc: "Frais d'inscription" },
    { student: studentRecords[3], amount: 400000, type: "TRANCHE1"    as const, method: "VIREMENT" as const,     receiptNum: "REC-2025-00005", desc: "1ère tranche scolarité" },
    { student: studentRecords[3], amount: 350000, type: "TRANCHE2"    as const, method: "VIREMENT" as const,     receiptNum: "REC-2025-00006", desc: "2ème tranche scolarité" },
    { student: studentRecords[4], amount: 250000, type: "INSCRIPTION" as const, method: "ESPECES" as const,      receiptNum: "REC-2025-00007", desc: "Frais d'inscription" },
  ];

  for (const p of paymentData) {
    await prisma.payment.upsert({
      where: { receiptNumber: p.receiptNum },
      update: {},
      create: { studentId: p.student.id, amount: p.amount, paymentMethod: p.method, receiptNumber: p.receiptNum, academicYear: "2025-2026", type: p.type, status: "VALIDE", description: p.desc },
    });
  }
  console.log("✅ Payments created");

  // Equipment
  const equipmentData = [
    { code: "PC-INFO1-001",   name: "PC Bureau Dell",             category: "Informatique",  brand: "Dell",    roomCode: "INFO-1",   status: "FONCTIONNEL"   as const },
    { code: "PC-INFO1-002",   name: "PC Bureau Dell",             category: "Informatique",  brand: "Dell",    roomCode: "INFO-1",   status: "FONCTIONNEL"   as const },
    { code: "PC-INFO2-001",   name: "PC Bureau HP",               category: "Informatique",  brand: "HP",      roomCode: "INFO-2",   status: "FONCTIONNEL"   as const },
    { code: "PROJ-AMPHI-A",   name: "Vidéoprojecteur Epson",      category: "Audiovisuel",   brand: "Epson",   roomCode: "AMPHI-A",  status: "FONCTIONNEL"   as const },
    { code: "PROJ-B1",        name: "Vidéoprojecteur BenQ",       category: "Audiovisuel",   brand: "BenQ",    roomCode: "COURS-B1", status: "EN_MAINTENANCE" as const },
    { code: "IMP-SECR-001",   name: "Imprimante HP LaserJet",     category: "Impression",    brand: "HP",      roomCode: undefined,  status: "FONCTIONNEL"   as const },
    { code: "IMP-SECR-002",   name: "Photocopieuse Canon",        category: "Impression",    brand: "Canon",   roomCode: undefined,  status: "EN_PANNE"      as const },
    { code: "TB-INFO1-001",   name: "Tableau Blanc 120×80",       category: "Mobilier",      brand: undefined, roomCode: "INFO-1",   status: "FONCTIONNEL"   as const },
    { code: "CLIM-AMPHI-A",   name: "Climatiseur Samsung 18000BTU", category: "Climatisation", brand: "Samsung", roomCode: "AMPHI-A", status: "FONCTIONNEL"  as const },
    { code: "CLIM-INFO-1",    name: "Climatiseur LG 12000BTU",    category: "Climatisation", brand: "LG",      roomCode: "INFO-1",   status: "EN_MAINTENANCE" as const },
  ];

  for (const e of equipmentData) {
    const roomId = e.roomCode ? rooms[e.roomCode]?.id : undefined;
    await prisma.equipment.upsert({
      where: { code: e.code },
      update: {},
      create: { code: e.code, name: e.name, category: e.category, brand: e.brand ?? null, roomId: roomId ?? null, status: e.status, purchaseDate: new Date("2024-09-01"), purchasePrice: 500000, nextMaintenanceDate: new Date("2026-06-01") },
    });
  }
  console.log("✅ Equipment created");

  // Internships
  const internshipCompanies = [
    { name: "MTN Cameroon",            address: "Boulevard du 20 Mai, Yaoundé",       phone: "+237 656 00 00 00", topic: "Développement d'une application mobile de gestion client",     status: "EN_COURS" as const },
    { name: "Orange Cameroun",         address: "Rue Joseph Mballa Eloumdem, Yaoundé", phone: "+237 699 00 00 00", topic: "Mise en place d'un système de monitoring réseau",              status: "CONVENTION_SIGNEE" as const },
    { name: "Express Union Finance",   address: "Carrefour Nlongkak, Yaoundé",        phone: "+237 677 00 00 00", topic: "Développement d'un portail de gestion des transactions",       status: "EN_RECHERCHE" as const },
    { name: "SABC (Brasseries)",       address: "Zone Industrielle, Douala",          phone: "+237 233 40 00 00", topic: "Optimisation du système ERP de production",                    status: "EN_RECHERCHE" as const },
    { name: "Société Générale Cameroun", address: "Place de l'Indépendance, Yaoundé", phone: "+237 222 00 00 00", topic: "Automatisation des rapports financiers",                       status: "EN_RECHERCHE" as const },
  ];

  for (let i = 0; i < internshipCompanies.length; i++) {
    const c = internshipCompanies[i];
    const student = studentRecords[i + 3];
    if (!student) continue;
    await prisma.internship.create({
      data: { studentId: student.id, companyName: c.name, companyAddress: c.address, companyPhone: c.phone, topic: c.topic, status: c.status, startDate: new Date("2026-06-01"), endDate: new Date("2026-08-31") },
    });
  }
  console.log("✅ Internships created");

  // Parent account (linked to Boris)
  const parentPassword = await hash("Parent@2025", 12);
  const parentUser = await prisma.user.upsert({
    where: { email: "parent.ndefogan@gmail.com" },
    update: {},
    create: { email: "parent.ndefogan@gmail.com", password: parentPassword, firstName: "NDE FOGAN", lastName: "Parent", role: "PARENT", mustChangePassword: false },
  });
  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { userId: parentUser.id, firstName: "NDE FOGAN", lastName: "Parent", phone: "+237 677 00 00 01", email: "parent.ndefogan@gmail.com", relation: "PERE" },
  });
  await prisma.student.update({ where: { id: borisStudent.id }, data: { parentId: parent.id } });
  console.log("✅ Parent account created");

  // TuitionFees with échéancier
  for (const [filiere, echeancier] of [
    [filierePE, ECHEANCIER_PE_PB],
    [filierePB, ECHEANCIER_PE_PB],
    [filiereMBA, ECHEANCIER_MBA_BBA],
    [filiereBBA, ECHEANCIER_MBA_BBA],
  ] as const) {
    await prisma.tuitionFee.upsert({
      where: { filiereId_academicYear: { filiereId: filiere.id, academicYear: "2025-2026" } },
      update: { installments: echeancier },
      create: { filiereId: filiere.id, academicYear: "2025-2026", totalAmount: filiere.totalFees, installments: echeancier },
    });
  }
  console.log("✅ Tuition fees + échéancier created");

  // ──────────────────────────────────────────────────────────────────────
  // Donnees academiques pour PB, MBA, BBA : UEs, cours, affectations, notes,
  // paiements, plannings et emargements. Permet de tester chaque filiere.
  // ──────────────────────────────────────────────────────────────────────
  type CourseDef = { code: string; name: string; credits: number; totalHours: number; teacher: string };
  type UEDef = { code: string; name: string; credits: number; courses: CourseDef[] };

  async function seedFiliereAcademics(
    filiereId: string,
    ueDefs: UEDef[],
    studentsForGrades: { id: string }[],
    receiptPrefix: string,
  ) {
    const createdCourses: { id: string; code: string }[] = [];

    for (const ue of ueDefs) {
      const ueRow = await prisma.uE.upsert({
        where: { code_filiereId: { code: ue.code, filiereId } },
        update: {},
        create: { code: ue.code, name: ue.name, filiereId, semester: 1, totalCredits: ue.credits },
      });
      for (const c of ue.courses) {
        const course = await prisma.course.upsert({
          where: { code: c.code },
          update: {},
          create: { code: c.code, name: c.name, credits: c.credits, totalHours: c.totalHours, filiereId, semester: 1, ueCode: ue.code, ueName: ue.name, ueId: ueRow.id },
        });
        createdCourses.push({ id: course.id, code: c.code });

        // Affectation enseignant
        const teacher = teacherUsers[c.teacher];
        if (teacher) {
          await prisma.courseAssignment.upsert({
            where: { courseId_teacherId_academicYear_semester: { courseId: course.id, teacherId: teacher.id, academicYear: "2025-2026", semester: 1 } },
            update: {},
            create: { courseId: course.id, teacherId: teacher.id, academicYear: "2025-2026", semester: 1 },
          });
        }
      }
    }

    // Notes : 3 etudiants, notes variees realistes
    const noteSets = [
      [14, 15, 13.5, 16, 12.5, 15.5],
      [11, 9.5, 13, 10.5, 14, 12],
      [17, 16.5, 18, 15.5, 16, 17.5],
    ];
    for (let si = 0; si < Math.min(3, studentsForGrades.length); si++) {
      const student = studentsForGrades[si];
      for (let ci = 0; ci < createdCourses.length; ci++) {
        const base = noteSets[si][ci % noteSets[si].length];
        const cc1 = Math.min(20, base + 0.5);
        const cc2 = Math.min(20, base - 0.5);
        const exam = base;
        const noteFinal = Math.round(((cc1 + cc2) / 2 * 0.4 + exam * 0.6) * 100) / 100;
        await prisma.grade.upsert({
          where: { studentId_courseId_academicYear_semester_session: { studentId: student.id, courseId: createdCourses[ci].id, academicYear: "2025-2026", semester: 1, session: "NORMALE" } },
          update: {},
          create: { studentId: student.id, courseId: createdCourses[ci].id, cc1, cc2, examScore: exam, noteFinal, session: "NORMALE", academicYear: "2025-2026", semester: 1 },
        });
      }
    }

    // Paiements : inscription + 1ere tranche pour les 3 premiers etudiants
    const methods = ["ESPECES", "ORANGE_MONEY", "MTN_MOMO", "VIREMENT"] as const;
    for (let si = 0; si < Math.min(3, studentsForGrades.length); si++) {
      const student = studentsForGrades[si];
      await prisma.payment.upsert({
        where: { receiptNumber: `${receiptPrefix}-INS-${si + 1}` },
        update: {},
        create: { studentId: student.id, amount: 250000, paymentMethod: methods[si % methods.length], receiptNumber: `${receiptPrefix}-INS-${si + 1}`, academicYear: "2025-2026", type: "INSCRIPTION", status: "VALIDE", description: "Frais d'inscription" },
      });
      if (si < 2) {
        await prisma.payment.upsert({
          where: { receiptNumber: `${receiptPrefix}-T1-${si + 1}` },
          update: {},
          create: { studentId: student.id, amount: 400000, paymentMethod: methods[(si + 1) % methods.length], receiptNumber: `${receiptPrefix}-T1-${si + 1}`, academicYear: "2025-2026", type: "TRANCHE1", status: "VALIDE", description: "1ère tranche scolarité" },
        });
      }
    }

    // Planning : un creneau par cours (max 4), avec emargements pour discipline
    const days = ["LUNDI", "MARDI", "MERCREDI", "JEUDI"] as const;
    const roomKeys = Object.keys(rooms);
    for (let ci = 0; ci < Math.min(4, createdCourses.length); ci++) {
      const assignment = await prisma.courseAssignment.findFirst({ where: { courseId: createdCourses[ci].id, academicYear: "2025-2026" } });
      if (!assignment) continue;
      const schedule = await prisma.schedule.create({
        data: {
          courseAssignmentId: assignment.id,
          roomId: rooms[roomKeys[ci % roomKeys.length]]?.id,
          dayOfWeek: days[ci % days.length],
          startTime: ci % 2 === 0 ? "08:00" : "10:00",
          endTime: ci % 2 === 0 ? "10:00" : "12:00",
          academicYear: "2025-2026",
          semester: 1,
          filiereId,
          type: "COURS",
          sessionNumber: 1,
          totalSessions: Math.ceil(createdCourses.length),
        },
      });
      // Emargements : presents, un absent, un retard pour varier les stats discipline
      for (let si = 0; si < Math.min(3, studentsForGrades.length); si++) {
        const status = si === 0 && ci === 0 ? "ABSENT" : si === 1 && ci === 1 ? "RETARD" : "PRESENT";
        await prisma.attendance.upsert({
          where: { studentId_scheduleId_date: { studentId: studentsForGrades[si].id, scheduleId: schedule.id, date: new Date("2025-10-06") } },
          update: {},
          create: { studentId: studentsForGrades[si].id, scheduleId: schedule.id, date: new Date("2025-10-06"), status: status as "PRESENT" | "ABSENT" | "RETARD" },
        });
      }
    }
  }

  await seedFiliereAcademics(filierePB.id, [
    { code: "B201", name: "MANAGEMENT FONDAMENTAL", credits: 9, courses: [
      { code: "B2011", name: "Management général", credits: 4, totalHours: 40, teacher: "BEYALA" },
      { code: "B2012", name: "Économie générale", credits: 3, totalHours: 30, teacher: "OBIANG" },
      { code: "B2013", name: "Droit des affaires", credits: 2, totalHours: 20, teacher: "NKANA" },
    ] },
    { code: "B202", name: "OUTILS DE GESTION", credits: 12, courses: [
      { code: "B2021", name: "Comptabilité générale", credits: 4, totalHours: 40, teacher: "FOUDA" },
      { code: "B2022", name: "Excel avancé", credits: 3, totalHours: 30, teacher: "TCHOUPO" },
      { code: "B2023", name: "Statistiques", credits: 3, totalHours: 30, teacher: "ATANGANA" },
    ] },
  ], pbStudentRecords, "REC-PB-2025");
  console.log("✅ Donnees academiques PB creees");

  await seedFiliereAcademics(filiereMBA.id, [
    { code: "M101", name: "STRATEGIC MANAGEMENT", credits: 9, courses: [
      { code: "M1011", name: "Corporate Strategy", credits: 4, totalHours: 40, teacher: "BEYALA" },
      { code: "M1012", name: "Finance d'entreprise", credits: 3, totalHours: 30, teacher: "OBIANG" },
      { code: "M1013", name: "Leadership", credits: 2, totalHours: 20, teacher: "ONANA" },
    ] },
    { code: "M102", name: "BUSINESS ANALYTICS", credits: 9, courses: [
      { code: "M1021", name: "Data Analysis", credits: 4, totalHours: 40, teacher: "MBARGA" },
      { code: "M1022", name: "Marketing stratégique", credits: 3, totalHours: 30, teacher: "BEYALA" },
    ] },
  ], mbaStudentRecords, "REC-MBA-2025");
  console.log("✅ Donnees academiques MBA creees");

  await seedFiliereAcademics(filiereBBA.id, [
    { code: "D101", name: "BUSINESS FUNDAMENTALS", credits: 9, courses: [
      { code: "D1011", name: "Introduction au management", credits: 4, totalHours: 40, teacher: "BEYALA" },
      { code: "D1012", name: "Microéconomie", credits: 3, totalHours: 30, teacher: "OBIANG" },
      { code: "D1013", name: "Communication", credits: 2, totalHours: 20, teacher: "BEYALA" },
    ] },
  ], bbaStudentRecords, "REC-BBA-2025");
  console.log("✅ Donnees academiques BBA creees");

  // Stages supplementaires pour MBA et BBA
  const extraInternships = [
    { student: mbaStudentRecords[0], name: "Afriland First Bank", address: "Place de l'Indépendance, Yaoundé", phone: "+237 222 23 30 68", topic: "Optimisation de la gestion du portefeuille clients PME", status: "EN_COURS" as const },
    { student: mbaStudentRecords[1], name: "Cimencam", address: "Bonabéri, Douala", phone: "+237 233 40 51 00", topic: "Analyse de la chaine logistique et reduction des couts", status: "CONVENTION_SIGNEE" as const },
    { student: bbaStudentRecords[0], name: "Camtel", address: "Immeuble siège, Yaoundé", phone: "+237 222 23 40 65", topic: "Strategie de fidelisation de la clientele mobile", status: "EN_RECHERCHE" as const },
    { student: bbaStudentRecords[1], name: "Dangote Cement Cameroon", address: "Douala", phone: "+237 233 50 00 00", topic: "Etude de marche pour le lancement d'un nouveau produit", status: "EN_COURS" as const },
  ];
  for (const it of extraInternships) {
    if (!it.student) continue;
    const exists = await prisma.internship.findFirst({ where: { studentId: it.student.id } });
    if (exists) continue;
    await prisma.internship.create({
      data: { studentId: it.student.id, companyName: it.name, companyAddress: it.address, companyPhone: it.phone, topic: it.topic, status: it.status, startDate: new Date("2026-06-01"), endDate: new Date("2026-08-31") },
    });
  }
  console.log("✅ Stages MBA et BBA crees");

  console.log("\n🎉 Seeding terminé avec succès !");
  console.log("\n📋 Comptes de test :");
  console.log("  ADMIN:     directrice@africaleadershipinstitute.com  / Admin@2025");
  console.log("  SCOLARITE: scolarite@africaleadershipinstitute.com   / Scolarite@2025");
  console.log("  ENSEIGNANT: obiang@africaleadershipinstitute.com     / Enseignant@2025");
  console.log("  ETUDIANT:  boris.rifel.nde.fogan@etu.africaleadershipinstitute.com / Etudiant@2025");
  console.log("  PARENT:    parent.ndefogan@gmail.com                 / Parent@2025");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
