import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";
import { LoiNghiepVu } from "@/lib/loi";
import { userIdTuPhien } from "./session";

export type NguoiDung = {
  id: string;
  username: string;
  hoTen: string;
  role: Role;
  boMonId: string | null;
  khoaId: string | null;
};

/** User hiện tại, đọc lại từ DB mỗi request (đổi chức vụ / xóa tài khoản có hiệu lực ngay). */
export const layNguoiDung = cache(async (): Promise<NguoiDung | null> => {
  const id = await userIdTuPhien();
  if (!id) return null;
  return db.user.findUnique({
    where: { id },
    select: { id: true, username: true, hoTen: true, role: true, boMonId: true, khoaId: true },
  });
});

/** Dùng trong page/layout: chưa đăng nhập → /dang-nhap; sai vai trò → /khong-co-quyen. */
export async function yeuCauVaiTro(...roles: Role[]): Promise<NguoiDung> {
  const u = await layNguoiDung();
  if (!u) redirect("/dang-nhap");
  if (roles.length && !roles.includes(u.role)) redirect("/khong-co-quyen");
  return u;
}

/** Dùng trong server action / route handler: ném LoiNghiepVu (401/403). */
export async function kiemTraVaiTro(...roles: Role[]): Promise<NguoiDung> {
  const u = await layNguoiDung();
  if (!u) throw new LoiNghiepVu("Phiên đăng nhập đã hết, vui lòng đăng nhập lại.", 401);
  if (roles.length && !roles.includes(u.role)) {
    throw new LoiNghiepVu("Bạn không có quyền thực hiện thao tác này.", 403);
  }
  return u;
}
