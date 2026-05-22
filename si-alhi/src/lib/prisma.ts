import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL?.startsWith("file:./")
    ? `file:${path.resolve(process.cwd(), process.env.DATABASE_URL.slice(5))}`
    : (process.env.DATABASE_URL ?? `file:${path.resolve(process.cwd(), "dev.db")}`);

  const adapter = new PrismaLibSql({ url: dbUrl });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
