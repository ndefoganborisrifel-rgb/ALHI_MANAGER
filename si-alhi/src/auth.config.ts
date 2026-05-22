import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/changer-mot-de-passe");
      const isApiAuth = pathname.startsWith("/api/auth");
      const isPublic = pathname === "/favicon.ico" || pathname.startsWith("/_next");

      if (isPublic || isApiAuth) return true;
      if (!isLoggedIn && !isAuthPage) return Response.redirect(new URL(`/login?callbackUrl=${pathname}`, nextUrl));
      if (isLoggedIn && (auth.user as { mustChangePassword?: boolean }).mustChangePassword && !isAuthPage) {
        return Response.redirect(new URL("/changer-mot-de-passe", nextUrl));
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
