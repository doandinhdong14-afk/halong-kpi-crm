import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import type { CoCau } from "@/lib/co-cau";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient;

/** Tải ảnh chụp cơ cấu tổ chức hiện tại (người, bộ môn, khoa). Dùng trong transaction thì truyền tx. */
export async function taiCoCau(tx: Tx = db): Promise<CoCau> {
  // Trong transaction: chạy tuần tự (một connection).
  const users = await tx.user.findMany({
    select: { id: true, hoTen: true, username: true, role: true, boMonId: true, khoaId: true },
    orderBy: [{ role: "asc" }, { hoTen: "asc" }],
  });
  const boMons = await tx.boMon.findMany({ select: { id: true, ten: true, khoaId: true }, orderBy: { ten: "asc" } });
  const khoas = await tx.khoa.findMany({ select: { id: true, ten: true, hieuPhoId: true }, orderBy: { ten: "asc" } });
  return { users, boMons, khoas };
}

/** Cơ cấu cho page server (tải một lần mỗi request). */
export const layCoCau = cache(() => taiCoCau());
