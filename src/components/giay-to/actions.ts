"use server";

import { db } from "@/lib/db";
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { hanhDong } from "@/lib/loi";

/** Ghi nhận người nhận đã xem giấy tờ (lần đầu mở). Không phải người nhận → bỏ qua. */
export async function danhDauDaXem(vanBanId: string) {
  return hanhDong(async () => {
    const u = await kiemTraVaiTro();
    const { count } = await db.vanBanNguoiNhan.updateMany({
      where: { vanBanId, userId: u.id, daXemLuc: null },
      data: { daXemLuc: new Date() },
    });
    return { moiXem: count > 0 };
  }, false);
}
