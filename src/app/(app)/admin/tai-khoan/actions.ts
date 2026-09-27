"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { hashMatKhau, MAT_KHAU_MAC_DINH } from "@/lib/auth/password";
import { hanhDong, LoiNghiepVu } from "@/lib/loi";
import { docDuLieu } from "@/lib/validate";
import { laDoiTuong, ROLES } from "@/lib/roles";
import {
  donViTheoVaiTro,
  ganKhoaPhuTrach,
  kiemTraGioiHan,
  sinhTenDangNhap,
  soKyCoKpiChuaChot,
  xoaKpiKyChuaChot,
} from "@/lib/services/tai-khoan";
import { xoaNhieuFile } from "@/lib/storage";

const HoTen = z.string().trim().min(1, "Vui lòng nhập họ tên.").max(100, "Họ tên quá dài.");
const VaiTro = z.enum(ROLES, { message: "Chức vụ không hợp lệ." });
const KhoaIds = z.array(z.string().min(1)).max(100).default([]);

/** Khóa tuần tự các thao tác thêm/sửa tài khoản, để kiểm tra giới hạn 2.4 không bị hai admin vượt qua cùng lúc. */
async function khoaTaiKhoan(tx: Prisma.TransactionClient) {
  // pg_advisory_xact_lock trả kiểu void (adapter không đọc được) → bọc trong FROM để trả về số.
  await tx.$queryRaw`SELECT 1 AS ok FROM pg_advisory_xact_lock(240901)`;
}

/**
 * Xem trước khi lưu (dialog Thêm/Sửa): tên đăng nhập sẽ được sinh, và khi đổi chức vụ thì số kỳ
 * chưa chốt đang có dữ liệu KPI sẽ bị xóa (A2).
 */
export async function xemTruocTaiKhoan(input: { hoTen: string; role: string; userId?: string }) {
  return hanhDong(async () => {
    await kiemTraVaiTro("ADMIN");
    const hoTen = docDuLieu(HoTen, input.hoTen);
    const role = docDuLieu(VaiTro, input.role);
    const username = await sinhTenDangNhap(db, hoTen, role, input.userId);
    let soKyCoKpi = 0;
    if (input.userId) {
      const cu = await db.user.findUnique({ where: { id: input.userId }, select: { role: true } });
      if (cu && cu.role !== role && laDoiTuong(cu.role)) soKyCoKpi = await soKyCoKpiChuaChot(db, input.userId);
    }
    return { username, soKyCoKpi };
  }, false);
}

export async function taoTaiKhoan(input: { hoTen: string; role: string; khoaPhuTrachIds?: string[] }) {
  return hanhDong(async () => {
    await kiemTraVaiTro("ADMIN");
    const hoTen = docDuLieu(HoTen, input.hoTen);
    const role = docDuLieu(VaiTro, input.role);
    const khoaIds = docDuLieu(KhoaIds, input.khoaPhuTrachIds);
    const passwordHash = await hashMatKhau(MAT_KHAU_MAC_DINH);

    return db.$transaction(async (tx) => {
      await khoaTaiKhoan(tx);
      const donVi = await donViTheoVaiTro(tx, role);
      await kiemTraGioiHan(tx, role, donVi);
      const username = await sinhTenDangNhap(tx, hoTen, role);
      const u = await tx.user.create({
        data: { username, hoTen, role, passwordHash, isDefaultPassword: true, ...donVi },
      });
      if (role === "HP") await ganKhoaPhuTrach(tx, u.id, khoaIds);
      return { username };
    });
  });
}

export async function suaTaiKhoan(input: {
  id: string;
  hoTen: string;
  role: string;
  khoaPhuTrachIds?: string[];
  xacNhanXoaKpi?: boolean;
}) {
  return hanhDong(async () => {
    const admin = await kiemTraVaiTro("ADMIN");
    const hoTen = docDuLieu(HoTen, input.hoTen);
    const role = docDuLieu(VaiTro, input.role);
    const khoaIds = docDuLieu(KhoaIds, input.khoaPhuTrachIds);

    const kq = await db.$transaction(async (tx) => {
      await khoaTaiKhoan(tx);
      const cu = await tx.user.findUnique({ where: { id: input.id } });
      if (!cu) throw new LoiNghiepVu("Tài khoản không tồn tại.", 404);
      if (cu.id === admin.id && role !== "ADMIN") {
        throw new LoiNghiepVu("Bạn không thể tự hạ chức của chính mình.", 403);
      }
      const doiVaiTro = cu.role !== role;
      const donVi = doiVaiTro ? await donViTheoVaiTro(tx, role) : { boMonId: cu.boMonId, khoaId: cu.khoaId };
      if (doiVaiTro) await kiemTraGioiHan(tx, role, donVi, cu.id);

      // A2: đổi chức vụ → dữ liệu KPI ở kỳ chưa chốt (theo vị trí cũ) bị xóa, phải xác nhận.
      let fileXoa: string[] = [];
      if (doiVaiTro && laDoiTuong(cu.role)) {
        const soKy = await soKyCoKpiChuaChot(tx, cu.id);
        if (soKy > 0 && !input.xacNhanXoaKpi) {
          throw new LoiNghiepVu(
            `Tài khoản đang có dữ liệu KPI ở ${soKy} kỳ chưa chốt. Đổi chức vụ sẽ xóa dữ liệu này, vui lòng xác nhận.`,
            409,
          );
        }
        if (soKy > 0) fileXoa = await xoaKpiKyChuaChot(tx, cu.id);
      }
      // Rời chức hiệu phó → các khoa phụ trách thành "chưa có hiệu phó".
      if (cu.role === "HP" && role !== "HP") {
        await tx.khoa.updateMany({ where: { hieuPhoId: cu.id }, data: { hieuPhoId: null } });
      }

      // Đổi họ tên hoặc đổi chức vụ → sinh lại tên đăng nhập (mục 2.2).
      const username = cu.hoTen === hoTen && !doiVaiTro ? cu.username : await sinhTenDangNhap(tx, hoTen, role, cu.id);
      await tx.user.update({ where: { id: cu.id }, data: { hoTen, role, username, ...donVi } });
      if (role === "HP") await ganKhoaPhuTrach(tx, cu.id, khoaIds);
      return { username, doiTen: username !== cu.username, fileXoa };
    });
    await xoaNhieuFile(kq.fileXoa);
    return { username: kq.username, doiTen: kq.doiTen };
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

/** Xóa hẳn tài khoản và toàn bộ dữ liệu KPI. Xóa hiệu phó → khoa phụ trách thành "chưa có hiệu phó" (SetNull). */
export async function xoaTaiKhoan(id: string) {
  return hanhDong(async () => {
    const admin = await kiemTraVaiTro("ADMIN");
    if (id === admin.id) throw new LoiNghiepVu("Bạn không thể tự xóa tài khoản của chính mình.", 403);

    // Lấy danh sách file minh chứng để xóa khỏi ổ đĩa sau khi xóa bản ghi (cascade chỉ xóa DB).
    const files = await db.fileDinhKem.findMany({
      where: { baiNop: { kpiTask: { userId: id } } },
      select: { duongDan: true },
    });
    const { count } = await db.user.deleteMany({ where: { id } });
    if (!count) throw new LoiNghiepVu("Tài khoản không tồn tại.", 404);
    await xoaNhieuFile(files.map((f) => f.duongDan));
  });
}
