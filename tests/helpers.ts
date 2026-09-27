import { execSync } from "node:child_process";
import { db } from "@/lib/db";

export const phien: { userId: string | null } = { userId: null };

/** Dọn sạch DB test (chỉ localhost + tên đuôi _test), áp migration, seed lại. */
export async function resetDb() {
  const url = new URL(process.env.DATABASE_URL!);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.endsWith("_test")) {
    throw new Error(`resetDb chỉ chạy trên DB test cục bộ: ${url.hostname}${url.pathname}`);
  }
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: process.env });
  const bang = await db.$queryRawUnsafe<{ tablename: string }[]>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'",
  );
  await db.$executeRawUnsafe(`TRUNCATE ${bang.map((b) => `"${b.tablename}"`).join(", ")} CASCADE`);
  execSync("npx tsx prisma/seed.ts", { stdio: "ignore", env: process.env });
}

/** Đăng nhập giả lập bằng username. */
export async function dangNhapNhu(username: string) {
  const u = await db.user.findUniqueOrThrow({ where: { username } });
  phien.userId = u.id;
  return u;
}

export async function user(username: string) {
  return db.user.findUniqueOrThrow({ where: { username } });
}
