import "server-only";
import type { Ky } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { trangThaiKy } from "@/lib/ky";
import { chonKy } from "@/lib/ky-hien-tai";
import { homNayVN } from "@/lib/time";

/**
 * Các kỳ đã công bố + kỳ đang chọn theo ?kyId= (B7): mặc định kỳ hiện tại (mục 10.1),
 * không có thì kỳ đã công bố gần nhất. Người làm KPI và cấp quản lý chỉ thấy kỳ đã công bố.
 */
export async function layKyTheoUrl(kyIdUrl: unknown): Promise<{ kys: Ky[]; ky: Ky | null }> {
  const kys = await db.ky.findMany({ where: { daCongBo: true }, orderBy: [{ ngayBatDau: "desc" }, { createdAt: "desc" }] });
  const ky = chonKy(kys, typeof kyIdUrl === "string" ? kyIdUrl : undefined, homNayVN());
  return { kys, ky };
}

/** Dữ liệu cho dropdown ChonKy: kỳ đã chốt ghi thêm nhãn. */
export function dsChonKy(kys: Ky[]) {
  return kys.map((k) => ({ id: k.id, ten: k.ten, nhanPhu: k.daChot ? trangThaiKy(k) : undefined }));
}
