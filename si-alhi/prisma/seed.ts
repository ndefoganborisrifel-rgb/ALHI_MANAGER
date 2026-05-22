import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hash } from "bcryptjs";
import path from "path";

const dbPath = `file:${path.resolve(process.cwd(), "dev.db")}`;
const adapter = new PrismaLibSql({ url: dbPath });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("🌱 Seeding database...");

  // Academic Year
  const academicYear = await prisma.academicYear.upsert({
    where: { label: "2025-2026" },
    update: {},
    create: { label: "2025-2026", startDate: new Date("2025-10-01"), endDate: new Date("2026-07-31"), isCurrent: true },
  });
  console.log("✅ Academic year created");

  // Filières
  const filieres = await Promise.all([
    prisma.filiere.upsert({
      where: { code: "ING" },
      update: {},
      create: { code: "ING", name: "Prépa Ingénieur", description: "Préparatoire aux grandes écoles d'ingénierie", duration: 2, totalFees: 850000 },
    }),
    prisma.filiere.upsert({
      where: { code: "CS" },
      update: {},
      create: { code: "CS", name: "Computer School", description: "Informatique et Technologies", duration: 2, totalFees: 850000 },
    }),
    prisma.filiere.upsert({
      where: { code: "BS" },
      update: {},
      create: { code: "BS", name: "Business School", description: "Gestion et Management", duration: 2, totalFees: 850000 },
    }),
    prisma.filiere.upsert({
      where: { code: "LP-IT" },
      update: {},
      create: { code: "LP-IT", name: "Licence Pro Technologies de l'Information", duration: 1, totalFees: 750000 },
    }),
    prisma.filiere.upsert({
      where: { code: "LP-GES" },
      update: {},
      create: { code: "LP-GES", name: "Licence Pro Gestion", duration: 1, totalFees: 750000 },
    }),
  ]);
  const [filiereING, filiereCS] = filieres;
  console.log("✅ Filières created");

  // UEs and Courses for ING filière
  const ueB101 = await prisma.uE.upsert({
    where: { code_filiereId: { code: "B101", filiereId: filiereING.id } },
    update: {},
    create: { code: "B101", name: "MATHÉMATIQUES APPLIQUÉES", filiereId: filiereING.id, semester: 1, totalCredits: 9 },
  });
  const ueB102 = await prisma.uE.upsert({
    where: { code_filiereId: { code: "B102", filiereId: filiereING.id } },
    update: {},
    create: { code: "B102", name: "DÉVELOPPEMENT & TECHNOLOGIE DU WEB", filiereId: filiereING.id, semester: 1, totalCredits: 12 },
  });
  const ueB103 = await prisma.uE.upsert({
    where: { code_filiereId: { code: "B103", filiereId: filiereING.id } },
    update: {},
    create: { code: "B103", name: "TECHNIQUES TRANSVERSALES ET DE PROFESSIONNALISATION", filiereId: filiereING.id, semester: 1, totalCredits: 9 },
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
    { code: "B1034", name: "Projet tutore N 1: Application de gestion de notes", credits: 3, totalHours: 30, ueCode: "B103", ueName: "TECHNIQUES TRANSVERSALES ET DE PROFESSIONNALISATION", ueId: ueB103.id },
    { code: "B1035", name: "Initiation au TOEIC", credits: 2, totalHours: 20, ueCode: "B103", ueName: "TECHNIQUES TRANSVERSALES ET DE PROFESSIONNALISATION", ueId: ueB103.id },
  ];

  const courses: Record<string, { id: string }> = {};
  for (const c of coursesData) {
    const course = await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: { ...c, filiereId: filiereING.id, semester: 1 },
    });
    courses[c.code] = course;
  }
  console.log("✅ Courses created");

  // Rooms
  const roomsData = [
    { code: "AMPHI-A", name: "Amphithéâtre A", capacity: 200, building: "Bâtiment Principal", floor: "RDC", hasProjector: true },
    { code: "AMPHI-B", name: "Amphithéâtre B", capacity: 150, building: "Bâtiment Principal", floor: "1er", hasProjector: true },
    { code: "INFO-1", name: "Salle Informatique 1", capacity: 30, building: "Bâtiment Tech", floor: "RDC", hasProjector: true, hasComputers: true },
    { code: "INFO-2", name: "Salle Informatique 2", capacity: 25, building: "Bâtiment Tech", floor: "1er", hasProjector: true, hasComputers: true },
    { code: "COURS-B1", name: "Salle de Cours B1", capacity: 40, building: "Bâtiment B", floor: "RDC", hasProjector: true },
    { code: "COURS-B2", name: "Salle de Cours B2", capacity: 40, building: "Bâtiment B", floor: "1er", hasProjector: false },
    { code: "COURS-B3", name: "Salle de Cours B3", capacity: 35, building: "Bâtiment B", floor: "2ème", hasProjector: true },
    { code: "CONF", name: "Salle de Conférence", capacity: 60, building: "Bâtiment Principal", floor: "2ème", hasProjector: true },
  ];

  const rooms: Record<string, { id: string }> = {};
  for (const r of roomsData) {
    const room = await prisma.room.upsert({ where: { code: r.code }, update: {}, create: r });
    rooms[r.code] = room;
  }
  console.log("✅ Rooms created");

  // Create users (admin, teachers, students, parents)
  const adminPassword = await hash("Admin@2025", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "directrice@africaleadershipinstitute.com" },
    update: {},
    create: {
      email: "directrice@africaleadershipinstitute.com",
      password: adminPassword,
      firstName: "Directrice",
      lastName: "ALHI",
      role: "ADMIN",
      mustChangePassword: false,
    },
  });

  const scolaritePassword = await hash("Scolarite@2025", 12);
  await prisma.user.upsert({
    where: { email: "scolarite@africaleadershipinstitute.com" },
    update: {},
    create: {
      email: "scolarite@africaleadershipinstitute.com",
      password: scolaritePassword,
      firstName: "Service",
      lastName: "Scolarité",
      role: "SCOLARITE",
      mustChangePassword: false,
    },
  });

  // Teachers
  const teachersData = [
    { email: "obiang@africaleadershipinstitute.com", firstName: "Dr.", lastName: "OBIANG", speciality: "Microéconomie", type: "PERMANENT" as const, hourlyRate: 15000 },
    { email: "nkana@africaleadershipinstitute.com", firstName: "M.", lastName: "NKANA", speciality: "Droit et Administration publique", type: "VACATAIRE" as const, hourlyRate: 12000 },
    { email: "fouda@africaleadershipinstitute.com", firstName: "Barthélémy Roland", lastName: "FOUDA", speciality: "Bases de données, Socialisation", type: "VACATAIRE" as const, hourlyRate: 12000 },
    { email: "atangana@africaleadershipinstitute.com", firstName: "Dr.", lastName: "ATANGANA", speciality: "Mathématiques", type: "PERMANENT" as const, hourlyRate: 15000 },
    { email: "mbarga@africaleadershipinstitute.com", firstName: "Mme.", lastName: "MBARGA", speciality: "Algorithmique", type: "VACATAIRE" as const, hourlyRate: 12000 },
    { email: "tchoupo@africaleadershipinstitute.com", firstName: "M.", lastName: "TCHOUPO", speciality: "Architecture Web", type: "VACATAIRE" as const, hourlyRate: 12000 },
    { email: "beyala@africaleadershipinstitute.com", firstName: "Dr.", lastName: "BEYALA", speciality: "Communication", type: "PERMANENT" as const, hourlyRate: 15000 },
    { email: "onana@africaleadershipinstitute.com", firstName: "M.", lastName: "ONANA", speciality: "Entrepreneuriat", type: "VACATAIRE" as const, hourlyRate: 10000 },
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

  // Schedules for ING filière
  const schedulesData = [
    { courseCode: "B1011", day: "LUNDI" as const, start: "08:00", end: "12:00", room: "AMPHI-A", session: 5, total: 9 },
    { courseCode: "B1012", day: "MARDI", start: "08:00", end: "12:00", room: "COURS-B1", session: 6, total: 9 },
    { courseCode: "B1024", day: "MERCREDI", start: "08:00", end: "12:00", room: "INFO-1", session: 2, total: 6 },
    { courseCode: "B1021", day: "JEUDI", start: "08:00", end: "12:00", room: "INFO-2", session: 4, total: 6 },
    { courseCode: "B1021", day: "VENDREDI", start: "08:00", end: "12:00", room: "INFO-2", session: 5, total: 6 },
    { courseCode: "B1021", day: "LUNDI", start: "13:20", end: "17:20", room: "INFO-1", session: 3, total: 6 },
    { courseCode: "B1031", day: "JEUDI", start: "13:20", end: "17:20", room: "COURS-B1", session: 3, total: 6 },
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
        filiereId: filiereING.id,
        type: "COURS",
        sessionNumber: s.session,
        totalSessions: s.total,
      },
    });
  }
  console.log("✅ Schedules created");

  // Students (from prototype)
  const studentsData = [
    { lastName: "BINOUMA ASSOUNANA", firstName: "Ange Jenny Willy", gender: "F" },
    { lastName: "FOTIE MAMBOU DEFFO", firstName: "Hilane", gender: "F" },
    { lastName: "NDE FOGAN", firstName: "Boris Rifel", gender: "M" },
    { lastName: "NNAH VOULA", firstName: "Clément Brady", gender: "M" },
    { lastName: "OKALA MANGA", firstName: "Junior Daryl", gender: "M" },
    { lastName: "OLINGA INGONGOMO", firstName: "Trésor", gender: "M" },
    { lastName: "SAADI", firstName: "Yannick Franck", gender: "M" },
    { lastName: "TAMBOU SEGNOU", firstName: "Junior", gender: "M" },
    { lastName: "ATANGANA", firstName: "Marie Claire", gender: "F" },
    { lastName: "MBARGA NGONO", firstName: "Paul Emmanuel", gender: "M" },
    { lastName: "EKAMBI", firstName: "Grace Bertille", gender: "F" },
    { lastName: "NGASSAM", firstName: "François Yves", gender: "M" },
    { lastName: "TCHOUPO", firstName: "Laure Divine", gender: "F" },
    { lastName: "NKOULOU", firstName: "Patrick Aurèle", gender: "M" },
    { lastName: "MESSI", firstName: "Christelle Ines", gender: "F" },
    { lastName: "ABENA", firstName: "Serge Armand", gender: "M" },
    { lastName: "ONANA", firstName: "Gaëlle Bérengère", gender: "F" },
    { lastName: "BEYALA", firstName: "Junior Christian", gender: "M" },
    { lastName: "NTEP", firstName: "Audrey Noëlle", gender: "F" },
    { lastName: "MBAPPÉ", firstName: "David Sébastien", gender: "M" },
  ];

  const studentPassword = await hash("Etudiant@2025", 12);
  const studentRecords: { id: string; firstName: string; lastName: string }[] = [];

  for (let i = 0; i < studentsData.length; i++) {
    const s = studentsData[i];
    const seq = i + 1;
    const matricule = `ALI/ING${String(seq).padStart(3, "0")}/25`;
    const email = `${s.firstName.toLowerCase().replace(/\s+/g, ".")}.${s.lastName.toLowerCase().replace(/\s+/g, ".")}@etu.africaleadershipinstitute.com`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, password: studentPassword, firstName: s.firstName, lastName: s.lastName, role: "ETUDIANT", mustChangePassword: false },
    });

    const student = await prisma.student.upsert({
      where: { matricule },
      update: {},
      create: {
        userId: user.id,
        matricule,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        filiereId: filiereING.id,
        promotionYear: 2025,
        level: 1,
        status: "ACTIF",
        city: "Yaoundé",
        email,
      },
    });
    studentRecords.push(student);
  }
  console.log("✅ Students created");

  // Grades for Boris Rifel (index 2) — from prototype
  const borisStudent = studentRecords[2];
  const borisGrades = [
    { code: "B1011", cc1: 18, cc2: null, exam: 18, final: 18 },
    { code: "B1012", cc1: 18.5, cc2: null, exam: 18.5, final: 18.5 },
    { code: "B1013", cc1: 18, cc2: null, exam: 18, final: 18 },
    { code: "B1021", cc1: 18.25, cc2: null, exam: 18.25, final: 18.25 },
    { code: "B1022", cc1: 18, cc2: null, exam: 18, final: 18 },
    { code: "B1023", cc1: 15, cc2: null, exam: 15, final: 15 },
    { code: "B1024", cc1: 19.5, cc2: null, exam: 19.5, final: 19.5 },
    { code: "B1025", cc1: 16.75, cc2: null, exam: 16.75, final: 16.75 },
    { code: "B1031", cc1: 10, cc2: 8.5, exam: null, final: 18.5 },
    { code: "B1032", cc1: 19, cc2: null, exam: 19, final: 19 },
    { code: "B1033", cc1: 18.5, cc2: null, exam: 18.5, final: 18.5 },
    { code: "B1034", cc1: 15, cc2: null, exam: 15, final: 15 },
    { code: "B1035", cc1: 16, cc2: null, exam: 16, final: 16 },
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
  console.log("✅ Boris Rifel grades created (from prototype)");

  // Payments
  const paymentData = [
    { student: studentRecords[0], amount: 350000, type: "TRANCHE1" as const, receiptNum: "REC-2025-00001" },
    { student: studentRecords[1], amount: 500000, type: "TRANCHE1" as const, receiptNum: "REC-2025-00002" },
    { student: borisStudent, amount: 350000, type: "TRANCHE1" as const, receiptNum: "REC-2025-00028" },
    { student: studentRecords[3], amount: 850000, type: "TRANCHE1" as const, receiptNum: "REC-2025-00004" },
    { student: studentRecords[4], amount: 200000, type: "TRANCHE1" as const, receiptNum: "REC-2025-00005" },
  ];

  for (const p of paymentData) {
    await prisma.payment.upsert({
      where: { receiptNumber: p.receiptNum },
      update: {},
      create: { studentId: p.student.id, amount: p.amount, paymentMethod: "ESPECES", receiptNumber: p.receiptNum, academicYear: "2025-2026", type: p.type, status: "VALIDE", description: "FRAIS SCOLARITE" },
    });
  }
  console.log("✅ Payments created");

  // Equipment
  const equipmentData = [
    { code: "PC-INFO1-001", name: "PC Bureau Dell", category: "Informatique", brand: "Dell", roomCode: "INFO-1", status: "FONCTIONNEL" as const },
    { code: "PC-INFO1-002", name: "PC Bureau Dell", category: "Informatique", brand: "Dell", roomCode: "INFO-1", status: "FONCTIONNEL" as const },
    { code: "PC-INFO2-001", name: "PC Bureau HP", category: "Informatique", brand: "HP", roomCode: "INFO-2", status: "FONCTIONNEL" as const },
    { code: "PROJ-AMPHI-A", name: "Vidéoprojecteur Epson", category: "Audiovisuel", brand: "Epson", roomCode: "AMPHI-A", status: "FONCTIONNEL" as const },
    { code: "PROJ-B1", name: "Vidéoprojecteur BenQ", category: "Audiovisuel", brand: "BenQ", roomCode: "COURS-B1", status: "EN_MAINTENANCE" as const },
    { code: "IMP-SECR-001", name: "Imprimante HP LaserJet", category: "Impression", brand: "HP", status: "FONCTIONNEL" as const },
    { code: "IMP-SECR-002", name: "Photocopieuse Canon", category: "Impression", brand: "Canon", status: "EN_PANNE" as const },
    { code: "TB-INFO1-001", name: "Tableau Blanc 120x80", category: "Mobilier", roomCode: "INFO-1", status: "FONCTIONNEL" as const },
    { code: "CLIM-AMPHI-A", name: "Climatiseur Samsung 18000BTU", category: "Climatisation", brand: "Samsung", roomCode: "AMPHI-A", status: "FONCTIONNEL" as const },
    { code: "CLIM-INFO-1", name: "Climatiseur LG 12000BTU", category: "Climatisation", brand: "LG", roomCode: "INFO-1", status: "EN_MAINTENANCE" as const },
  ];

  for (const e of equipmentData) {
    const roomId = e.roomCode ? rooms[e.roomCode]?.id : undefined;
    await prisma.equipment.upsert({
      where: { code: e.code },
      update: {},
      create: { code: e.code, name: e.name, category: e.category, brand: e.brand, roomId, status: e.status, purchaseDate: new Date("2024-09-01"), purchasePrice: 500000, nextMaintenanceDate: new Date("2026-06-01") },
    });
  }
  console.log("✅ Equipment created");

  // Internships
  const internshipCompanies = [
    { name: "MTN Cameroon", address: "Boulevard du 20 Mai, Yaoundé", phone: "+237 656 00 00 00", topic: "Développement d'une application mobile de gestion client" },
    { name: "Orange Cameroun", address: "Rue Joseph Mballa Eloumdem, Yaoundé", phone: "+237 699 00 00 00", topic: "Mise en place d'un système de monitoring réseau" },
    { name: "Express Union Finance", address: "Carrefour Nlongkak, Yaoundé", phone: "+237 677 00 00 00", topic: "Développement d'un portail de gestion des transactions" },
    { name: "SABC (Brasseries)", address: "Zone Industrielle, Douala", phone: "+237 233 40 00 00", topic: "Optimisation du système ERP de production" },
    { name: "Société Générale Cameroun", address: "Place de l'Indépendance, Yaoundé", phone: "+237 222 00 00 00", topic: "Automatisation des rapports financiers" },
  ];

  for (let i = 0; i < Math.min(internshipCompanies.length, studentRecords.length); i++) {
    const c = internshipCompanies[i];
    await prisma.internship.create({
      data: {
        studentId: studentRecords[i + 3].id,
        companyName: c.name,
        companyAddress: c.address,
        companyPhone: c.phone,
        topic: c.topic,
        status: i === 0 ? "EN_COURS" : i === 1 ? "CONVENTION_SIGNEE" : "EN_RECHERCHE",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-08-31"),
      },
    });
  }
  console.log("✅ Internships created");

  // Parent account
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

  // TuitionFees
  for (const filiere of filieres) {
    await prisma.tuitionFee.upsert({
      where: { filiereId_academicYear: { filiereId: filiere.id, academicYear: "2025-2026" } },
      update: {},
      create: { filiereId: filiere.id, academicYear: "2025-2026", totalAmount: filiere.totalFees },
    });
  }
  console.log("✅ Tuition fees created");

  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📋 Test accounts:");
  console.log("  ADMIN:     directrice@africaleadershipinstitute.com / Admin@2025");
  console.log("  SCOLARITE: scolarite@africaleadershipinstitute.com / Scolarite@2025");
  console.log("  ENSEIGNANT: obiang@africaleadershipinstitute.com / Enseignant@2025");
  console.log("  ETUDIANT:  boris.rifel.nde.fogan@etu.africaleadershipinstitute.com / Etudiant@2025");
  console.log("  PARENT:    parent.ndefogan@gmail.com / Parent@2025");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
