import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "./layout-client";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.mustChangePassword) redirect("/changer-mot-de-passe");

  return (
    <DashboardLayoutClient
      userName={session.user.name ?? ""}
      userRole={session.user.role}
    >
      {children}
    </DashboardLayoutClient>
  );
}
