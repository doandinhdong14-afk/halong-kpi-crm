"use server";

import { kiemTraNguoiLamKpi } from "@/lib/auth/dal";
import { hanhDong } from "@/lib/loi";
import { chonNhiemVu as chon, guiDangKy as gui } from "@/lib/services/dang-ky";

/** Tick / bỏ tick một nhiệm vụ (tự lưu). */
export async function chonNhiemVu(input: { kyId: string; nhiemVuId: string; chon: boolean }) {
  return hanhDong(async () => chon(await kiemTraNguoiLamKpi(), input), false);
}

/** Gửi danh sách lên người duyệt. */
export async function guiDangKy(kyId: string) {
  return hanhDong(async () => gui(await kiemTraNguoiLamKpi(), kyId));
}
