import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTeacherCourseIds } from "@/lib/authz";
import { SaisieClient } from "./SaisieClient";

export default async function SaisieNotesCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["ADMIN", "SCOLARITE", "ENSEIGNANT"].includes(role)) redirect("/dashboard");

  const { courseId } = await params;

  // Staff edit any subject; a teacher edits only the subjects assigned to them,
  // everything else is read-only. The API enforces the same rule on write.
  const isStaff = role === "ADMIN" || role === "SCOLARITE";
  const canEdit = isStaff || (await getTeacherCourseIds(session.user.id)).includes(courseId);

  return <SaisieClient courseId={courseId} canEdit={canEdit} />;
}
