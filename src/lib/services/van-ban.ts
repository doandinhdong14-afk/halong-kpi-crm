// Ban hành quy định (mục 9) và Nhận giấy tờ (mục 6.4, 8.3).
// Người nhận tính theo CHỨC VỤ HIỆN TẠI mỗi lần xem: user.role ∈ vanBan.viTriNhan (ghi chú 12.2).
// Người được thêm vào vị trí sau này cũng thấy; đổi chức vụ thì thấy quy định của vị trí mới.
import "server-only";
import type { Role } from "@/generated/prisma/enums";
import type { NguoiDung } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { LoiNghiepVu } from "@/lib/loi";
import { xoaNhieuFile } from "@/lib/storage";
import { guiThongBao } from "@/lib/thong-bao";
import { layChuoi, layFile, luuFiles } from "./file-upload";

/** Các vị trí được tick nhận quy định (HT không nhận). */
export const VI_TRI_NHAN = ["GV", "TBM", "TK", "HP", "ADMIN"] as const satisfies readonly Role[];

/** Link xem quy định theo vai trò người nhận: Admin → Nhận chỉ thị, còn lại → Nhận giấy tờ. */
export function linkGiayTo(role: Role, vanBanId: string) {
  return role === "ADMIN" ? `/admin/chi-thi/${vanBanId}` : `/giay-to/${vanBanId}`;
}

/** HT ban hành quy định. Form: tieuDe, noiDung, viTriNhan (≥1), files (không bắt buộc). */
export async function banHanhQuyDinh(ht: NguoiDung, form: FormData) {
  const tieuDe = layChuoi(form, "tieuDe", 300);
  const noiDung = layChuoi(form, "noiDung", 20000);
  if (!tieuDe) throw new LoiNghiepVu("Vui lòng nhập tiêu đề.");
  if (!noiDung) throw new LoiNghiepVu("Vui lòng nhập nội dung.");
  const viTri = [...new Set(form.getAll("viTriNhan").filter((v): v is string => typeof v === "string"))];
  if (!viTri.length) throw new LoiNghiepVu("Vui lòng tick ít nhất 1 vị trí nhận.");
  if (viTri.some((v) => !(VI_TRI_NHAN as readonly string[]).includes(v))) throw new LoiNghiepVu("Vị trí nhận không hợp lệ.");
  const viTriNhan = viTri as Role[];
  const files = layFile(form);

  const daLuu = await luuFiles(files);
  try {
    return await db.$transaction(async (tx) => {
      const vb = await tx.vanBan.create({
        data: { tieuDe, noiDung, viTriNhan, nguoiGuiId: ht.id, files: { create: daLuu } },
      });
      // Thông báo "Quy định mới" cho mọi tài khoản đang ở các vị trí được tick (mục 11).
      const nguoiNhan = await tx.user.findMany({ where: { role: { in: viTriNhan } }, select: { id: true, role: true } });
      for (const role of viTriNhan) {
        await guiThongBao(
          tx,
          nguoiNhan.filter((u) => u.role === role).map((u) => u.id),
          `Quy định mới từ hiệu trưởng: ${tieuDe}`,
          { link: linkGiayTo(role, vb.id), tru: ht.id },
        );
      }
      return { vanBanId: vb.id, soNguoiNhan: nguoiNhan.length };
    });
  } catch (e) {
    await xoaNhieuFile(daLuu.map((f) => f.duongDan));
    throw e;
  }
}

/** Quy định mà u đang nhận (theo chức vụ hiện tại), kèm đã xem hay chưa. */
export async function dsGiayToCuaToi(u: NguoiDung) {
  const ds = await db.vanBan.findMany({
    where: { viTriNhan: { has: u.role } },
    orderBy: { guiLuc: "desc" },
    include: { daXems: { where: { userId: u.id }, select: { daXemLuc: true } }, _count: { select: { files: true } } },
  });
  return ds.map((v) => ({ id: v.id, tieuDe: v.tieuDe, guiLuc: v.guiLuc, soFile: v._count.files, daXem: v.daXems.length > 0 }));
}

/** Một quy định u được xem (theo chức vụ hiện tại); không phải người nhận → null. */
export async function layGiayToCuaToi(u: NguoiDung, vanBanId: string) {
  return db.vanBan.findFirst({
    where: { id: vanBanId, viTriNhan: { has: u.role } },
    include: {
      nguoiGui: { select: { hoTen: true } },
      files: { orderBy: { taoLuc: "asc" }, select: { id: true, tenGoc: true, kichThuoc: true, mimeType: true } },
    },
  });
}

/** Lần đầu mở → ghi nhận đã xem. Không phải người nhận → bỏ qua. */
export async function danhDauDaXem(u: NguoiDung, vanBanId: string) {
  const vb = await db.vanBan.findFirst({ where: { id: vanBanId, viTriNhan: { has: u.role } }, select: { id: true } });
  if (!vb) return { moiXem: false };
  const { count } = await db.vanBanDaXem.createMany({ data: [{ vanBanId, userId: u.id }], skipDuplicates: true });
  return { moiXem: count > 0 };
}

/**
 * Người nhận hiện tại của từng quy định + ai đã xem (B11: x chỉ đếm trong y người đang ở vị trí nhận).
 */
export async function nguoiNhanHienTai(vanBanIds: string[]) {
  const vbs = await db.vanBan.findMany({
    where: { id: { in: vanBanIds } },
    select: { id: true, viTriNhan: true, daXems: { select: { userId: true, daXemLuc: true } } },
  });
  const users = await db.user.findMany({
    where: { role: { in: [...VI_TRI_NHAN] } },
    select: { id: true, hoTen: true, username: true, role: true },
    orderBy: [{ role: "asc" }, { hoTen: "asc" }],
  });
  return new Map(
    vbs.map((vb) => {
      const nhan = users
        .filter((u) => vb.viTriNhan.includes(u.role))
        .map((u) => ({ ...u, daXemLuc: vb.daXems.find((x) => x.userId === u.id)?.daXemLuc ?? null }));
      return [vb.id, { nhan, soDaXem: nhan.filter((n) => n.daXemLuc).length }];
    }),
  );
}
