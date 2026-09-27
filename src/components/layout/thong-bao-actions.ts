"use server";

import { db } from "@/lib/db";
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { hanhDong } from "@/lib/loi";

/** Đánh dấu một thông báo của chính mình là đã đọc. */
export async function docThongBao(id: string) {
  return hanhDong(async () => {
    const u = await kiemTraVaiTro();
    await db.thongBao.updateMany({ where: { id, userId: u.id }, data: { daDoc: true } });
  }, false);
}

export async function docTatCaThongBao() {
  return hanhDong(async () => {
    const u = await kiemTraVaiTro();
    await db.thongBao.updateMany({ where: { userId: u.id, daDoc: false }, data: { daDoc: true } });
  }, false);
}
