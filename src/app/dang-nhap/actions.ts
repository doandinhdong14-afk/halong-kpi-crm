"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { kiemTraMatKhau } from "@/lib/auth/password";
import { taoPhien, xoaPhien } from "@/lib/auth/session";
import { trangChu } from "@/lib/menu";

export type TrangThaiDangNhap = { error?: string; username?: string };

export async function dangNhap(_: TrangThaiDangNhap, formData: FormData): Promise<TrangThaiDangNhap> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const matKhau = String(formData.get("matKhau") ?? "");
  if (!username || !matKhau) return { error: "Vui lòng nhập tên đăng nhập và mật khẩu.", username };

  const user = await db.user.findUnique({ where: { username } });
  if (!user || !(await kiemTraMatKhau(matKhau, user.passwordHash))) {
    return { error: "Tên đăng nhập hoặc mật khẩu không đúng.", username };
  }

  await taoPhien(user.id);
  redirect(trangChu(user.role));
}

export async function dangXuat() {
  await xoaPhien();
  redirect("/dang-nhap");
}
