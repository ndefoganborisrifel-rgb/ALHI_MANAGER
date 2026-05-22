import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      mustChangePassword: boolean;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    mustChangePassword: boolean;
  }
}
