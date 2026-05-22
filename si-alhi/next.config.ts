import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@libsql/client", "bcryptjs"],
};

export default nextConfig;
