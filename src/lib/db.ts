import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function taoClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
}

export const db = globalForPrisma.prisma ?? taoClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
