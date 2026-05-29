import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function AuthLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1A1A1A 0%, #2d2d2d 50%, #111 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(185,28,47,0.3)",
          borderTopColor: "#B91C2F",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const mustChange = (session?.user as { mustChangePassword?: boolean } | undefined)?.mustChangePassword;
  // Only send logged-in users away if they do not need to change their password.
  // Users with mustChangePassword=true must reach /changer-mot-de-passe; redirecting
  // them to /dashboard creates a loop with the middleware.
  if (session?.user && !mustChange) redirect("/dashboard");
  return <Suspense fallback={<AuthLoading />}>{children}</Suspense>;
}
