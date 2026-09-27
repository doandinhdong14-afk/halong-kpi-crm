import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient;

/**
 * Tạo thông báo trong web cho danh sách người nhận.
 * maSuKien: khóa chống trùng (vd nhắc hạn) — cùng user + maSuKien chỉ tạo một lần.
 */
export async function guiThongBao(
  tx: Tx,
  userIds: string[],
  noiDung: string,
  link?: string,
  maSuKien?: string,
): Promise<number> {
  const ids = [...new Set(userIds)];
  if (!ids.length) return 0;
  const { count } = await tx.thongBao.createMany({
    data: ids.map((userId) => ({ userId, noiDung, link: link ?? null, maSuKien: maSuKien ?? null })),
    skipDuplicates: true,
  });
  return count;
}

/** Id các TBM của bộ môn (người nhận thông báo từ GV). */
export async function tbmCuaBoMon(tx: Tx = db, boMonId: string | null): Promise<string[]> {
  if (!boMonId) return [];
  const tbms = await tx.user.findMany({ where: { role: "TBM", boMonId }, select: { id: true } });
  return tbms.map((t) => t.id);
}
