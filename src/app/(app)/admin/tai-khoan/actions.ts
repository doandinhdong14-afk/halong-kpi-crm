"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { hashMatKhau, MAT_KHAU_MAC_DINH } from "@/lib/auth/password";
import { hanhDong, LoiNghiepVu } from "@/lib/loi";
import { ROLES } from "@/lib/roles";
import { sinhTenDangNhap } from "@/lib/services/tai-khoan";
import { xoaNhieuFile } from "@/lib/storage";

const HoTen = z.string().trim().min(1, "Vui lòng nhập họ tên.").max(100, "Họ tên quá dài.");
const VaiTro = z.enum(ROLES, { message: "Chức vụ không hợp lệ." });

function doc<T>(schema: z.ZodType<T>, v: unknown): T {
  const r = schema.safeParse(v);
  if (!r.success) throw new LoiNghiepVu(r.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
  return r.data;
}

/** Xem trước tên đăng nhập sẽ được sinh (dialog Thêm/Sửa). */
export async function xemTruocTenDangNhap(input: { hoTen: string; role: string; userId?: string }) {
  return hanhDong(async () => {
    await kiemTraVaiTro("ADMIN");
    const hoTen = doc(HoTen, input.hoTen);
    const role = doc(VaiTro, input.role);
    return sinhTenDangNhap(db, hoTen, role, input.userId);
  }, false);
}

export async function taoTaiKhoan(input: { hoTen: string; role: string }) {
  return hanhDong(async () => {
    await kiemTraVaiTro("ADMIN");
    const hoTen = doc(HoTen, input.hoTen);
    const role = doc(VaiTro, input.role);
    const passwordHash = await hashMatKhau(MAT_KHAU_MAC_DINH);
    // Demo 1 bộ môn: mọi tài khoản mới gán vào bộ môn đầu tiên (mục 2.4).
    const boMon = await db.boMon.findFirst({ orderBy: { ten: "asc" }, select: { id: true } });

    return db.$transaction(async (tx) => {
      const username = await sinhTenDangNhap(tx, hoTen, role);
      await tx.user.create({
        data: { username, hoTen, role, passwordHash, isDefaultPassword: true, boMonId: boMon?.id ?? null },
      });
      return { username };
    });
  });
}

export async function suaTaiKhoan(input: { id: string; hoTen: string; role: string }) {
  return hanhDong(async () => {
    const admin = await kiemTraVaiTro("ADMIN");
    const hoTen = doc(HoTen, input.hoTen);
    const role = doc(VaiTro, input.role);

    return db.$transaction(async (tx) => {
      const cu = await tx.user.findUnique({ where: { id: input.id } });
      if (!cu) throw new LoiNghiepVu("Tài khoản không tồn tại.", 404);
      if (cu.id === admin.id && role !== "ADMIN") {
        throw new LoiNghiepVu("Bạn không thể tự hạ chức của chính mình.", 403);
      }
      if (cu.hoTen === hoTen && cu.role === role) return { username: cu.username, doiTen: false };

      // Đổi họ tên hoặc đổi chức vụ → sinh lại tên đăng nhập (mục 2.2).
      const username = await sinhTenDangNhap(tx, hoTen, role, cu.id);
      await tx.user.update({ where: { id: cu.id }, data: { hoTen, role, username } });
      return { username, doiTen: username !== cu.username };
    });
  });
}

export async function datLaiMatKhau(id: string) {
  return hanhDong(async () => {
    await kiemTraVaiTro("ADMIN");
    const passwordHash = await hashMatKhau(MAT_KHAU_MAC_DINH);
    const { count } = await db.user.updateMany({ where: { id }, data: { passwordHash, isDefaultPassword: true } });
    if (!count) throw new LoiNghiepVu("Tài khoản không tồn tại.", 404);
  });
}

export async function xoaTaiKhoan(id: string) {
  return hanhDong(async () => {
    const admin = await kiemTraVaiTro("ADMIN");
    if (id === admin.id) throw new LoiNghiepVu("Bạn không thể tự xóa tài khoản của chính mình.", 403);

    // Lấy danh sách file minh chứng để xóa khỏi ổ đĩa sau khi xóa bản ghi (cascade chỉ xóa DB).
    const files = await db.fileDinhKem.findMany({
      where: { baiNop: { gvTask: { gvId: id } } },
      select: { duongDan: true },
    });
    const { count } = await db.user.deleteMany({ where: { id } });
    if (!count) throw new LoiNghiepVu("Tài khoản không tồn tại.", 404);
    await xoaNhieuFile(files.map((f) => f.duongDan));
  });
}
