import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth + prisma so we exercise the route guards in isolation, without a DB.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    schedule: { delete: vi.fn().mockResolvedValue({ id: "sched_1" }), create: vi.fn(), findFirst: vi.fn() },
    grade: { upsert: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
    courseAssignment: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
    teacher: { findUnique: vi.fn().mockResolvedValue({ id: "teacher_1" }) },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DELETE as deleteSchedule } from "@/app/api/schedules/[id]/route";
import { POST as upsertGrade } from "@/app/api/grades/route";

const mockAuth = vi.mocked(auth);

function asUser(role: string, id = "user_1") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockAuth.mockResolvedValue({ user: { id, role } } as any);
}

const params = { params: Promise.resolve({ id: "sched_1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  // restore default resolved values cleared above
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma.schedule.delete as any).mockResolvedValue({ id: "sched_1" });
});

describe("Timetable (emploi-du-temps) write protection", () => {
  it("forbids a student from deleting a schedule slot", async () => {
    asUser("ETUDIANT");
    const res = await deleteSchedule(new Request("http://test/api/schedules/sched_1", { method: "DELETE" }), params);
    expect(res.status).toBe(403);
    expect(prisma.schedule.delete).not.toHaveBeenCalled();
  });

  it("forbids a parent from deleting a schedule slot", async () => {
    asUser("PARENT");
    const res = await deleteSchedule(new Request("http://test/api/schedules/sched_1", { method: "DELETE" }), params);
    expect(res.status).toBe(403);
    expect(prisma.schedule.delete).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated delete with 401", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockAuth.mockResolvedValue(null as any);
    const res = await deleteSchedule(new Request("http://test/api/schedules/sched_1", { method: "DELETE" }), params);
    expect(res.status).toBe(401);
    expect(prisma.schedule.delete).not.toHaveBeenCalled();
  });

  it("allows an admin to delete a schedule slot", async () => {
    asUser("ADMIN");
    const res = await deleteSchedule(new Request("http://test/api/schedules/sched_1", { method: "DELETE" }), params);
    expect(res.status).toBe(200);
    expect(prisma.schedule.delete).toHaveBeenCalledOnce();
  });
});

describe("Grades write protection", () => {
  const validGrade = {
    studentId: "clz0000000000000000000001",
    courseId: "clz0000000000000000000002",
    cc1: 12,
  };

  it("forbids a student from saving a grade", async () => {
    asUser("ETUDIANT");
    const res = await upsertGrade(new Request("http://test/api/grades", { method: "POST", body: JSON.stringify(validGrade) }));
    expect(res.status).toBe(403);
    expect(prisma.grade.upsert).not.toHaveBeenCalled();
  });

  it("forbids a teacher from saving a grade for a subject they do not teach", async () => {
    asUser("ENSEIGNANT");
    // teacher owns no courses (courseAssignment.findMany -> [])
    const res = await upsertGrade(new Request("http://test/api/grades", { method: "POST", body: JSON.stringify(validGrade) }));
    expect(res.status).toBe(403);
    expect(prisma.grade.upsert).not.toHaveBeenCalled();
  });
});
