import "server-only";
import type { NguoiDung } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { LoiNghiepVu } from "@/lib/loi";
import { xoaNhieuFile } from "@/lib/storage";
import { guiThongBao } from "@/lib/thong-bao";
import { layChuoi, layFile, luuFiles } from "./file-upload";

/** Link xem giấy tờ theo vai trò người nhận: Admin → Nhận chỉ thị, còn lại → Nhận giấy tờ. */
export function linkGiayTo(role: string, vanBanId: string) {
  return role === "ADMIN" ? `/admin/chi-thi/${vanBanId}` : `/giay-to/${vanBanId}`;
}

/**
 * HT ban hành giấy tờ (mục 8). Form: tieuDe, noiDung, files (không bắt buộc), nguoiNhanIds (≥1).
 * Người nhận: mọi tài khoản trừ Hiệu trưởng (quyết định #10).
 */
export async function banHanhVanBan(ht: NguoiDung, form: FormData) {
  const tieuDe = layChuoi(form, "tieuDe", 300);
  const noiDung = layChuoi(form, "noiDung", 20000);
  if (!tieuDe) throw new LoiNghiepVu("Vui lòng nhập tiêu đề.");
  if (!noiDung) throw new LoiNghiepVu("Vui lòng nhập nội dung.");
  const ids = [...new Set(form.getAll("nguoiNhanIds").filter((v): v is string => typeof v === "string" && v !== ""))];
  if (!ids.length) throw new LoiNghiepVu("Vui lòng chọn ít nhất 1 người nhận.");
  const nguoiNhan = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, role: true } });
  if (nguoiNhan.length !== ids.length || nguoiNhan.some((u) => u.role === "HT")) {
    throw new LoiNghiepVu("Danh sách người nhận không hợp lệ.");
  }
  const files = layFile(form);

  const daLuu = await luuFiles(files);
  try {
    return await db.$transaction(async (tx) => {
      const vb = await tx.vanBan.create({
        data: {
          tieuDe,
          noiDung,
          nguoiGuiId: ht.id,
          files: { create: daLuu },
          nguoiNhans: { create: ids.map((userId) => ({ userId })) },
        },
      });
      // Thông báo "Có giấy tờ mới", link theo vai trò người nhận.
      for (const u of nguoiNhan) {
        await guiThongBao(tx, [u.id], `Có giấy tờ mới từ hiệu trưởng: ${tieuDe}`, linkGiayTo(u.role, vb.id));
      }
      return { vanBanId: vb.id, soNguoiNhan: ids.length };
    });
  } catch (e) {
    await xoaNhieuFile(daLuu.map((f) => f.duongDan));
    throw e;
  }
}
