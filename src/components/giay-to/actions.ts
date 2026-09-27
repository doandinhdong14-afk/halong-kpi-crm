"use server";

import { kiemTraVaiTro } from "@/lib/auth/dal";
import { hanhDong } from "@/lib/loi";
import { danhDauDaXem as danhDau } from "@/lib/services/van-ban";

/** Ghi nhận người nhận đã xem quy định (lần đầu mở). Không phải người nhận → bỏ qua. */
export async function danhDauDaXem(vanBanId: string) {
  return hanhDong(async () => danhDau(await kiemTraVaiTro("GV", "TBM", "TK", "HP", "ADMIN"), vanBanId), false);
}
