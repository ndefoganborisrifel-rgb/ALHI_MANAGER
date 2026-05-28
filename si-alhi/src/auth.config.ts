import type { NextAuthConfig } from "next-auth";

// Server-side route guard. Each rule lists the roles allowed on a path prefix.
// This mirrors the sidebar nav but is enforced before the page renders, so a
// student cannot reach a management page by typing its URL. The first matching
// rule wins; unlisted paths are allowed to any authenticated user.
const ROUTE_RULES: { prefix: string; roles: string[] }[] = [
  { prefix: "/users", roles: ["ADMIN"] },
  { prefix: "/logistique", roles: ["ADMIN"] },
  { prefix: "/admission", roles: ["ADMIN", "SCOLARITE"] },
  { prefix: "/scolarite", roles: ["ADMIN", "SCOLARITE"] },
  { prefix: "/rh", roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT"] },
  { prefix: "/pedagogie/cours", roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT"] },
  { prefix: "/stages", roles: ["ADMIN", "SCOLARITE", "ETUDIANT"] },
  { prefix: "/discipline", roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT", "PARENT"] },
  { prefix: "/parent", roles: ["PARENT", "ADMIN"] },
  // Bulletin management (publish button, list of students) is admin/scolarite only.
  // Students access their own bulletin via /examens (which shows a link) and /print/bulletin/[id].
  { prefix: "/examens/bulletins", roles: ["ADMIN", "SCOLARITE"] },
  { prefix: "/examens/saisie", roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT"] },
  { prefix: "/examens/pv", roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT"] },
  { prefix: "/examens/deliberation", roles: ["ADMIN", "SCOLARITE"] },
  // /pedagogie (timetable) and /examens (index) stay open to all authenticated users;
  // they are read-only for students at the API layer.
];

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/changer-mot-de-passe") || pathname.startsWith("/mot-de-passe-oublie");
      const isApiAuth = pathname.startsWith("/api/auth");
      const isPublic = pathname === "/favicon.ico" || pathname.startsWith("/_next");

      if (isPublic || isApiAuth) return true;
      if (!isLoggedIn && !isAuthPage) return Response.redirect(new URL(`/login?callbackUrl=${pathname}`, nextUrl));
      if (isLoggedIn && (auth!.user as { mustChangePassword?: boolean }).mustChangePassword && !isAuthPage) {
        return Response.redirect(new URL("/changer-mot-de-passe", nextUrl));
      }

      if (isLoggedIn && !isAuthPage) {
        const role = (auth!.user as { role?: string }).role ?? "ETUDIANT";
        const rule = ROUTE_RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
        if (rule && !rule.roles.includes(role)) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as { role?: string; mustChangePassword?: boolean };
        token.role = u.role ?? "ETUDIANT";
        token.mustChangePassword = u.mustChangePassword ?? true;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.role = (token.role as string) ?? "ETUDIANT";
        session.user.mustChangePassword = (token.mustChangePassword as boolean) ?? false;
        session.user.id = token.sub ?? "";
      }
      return session;
    },
  },
  providers: [],
};
