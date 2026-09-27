import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { LoiNghiepVu } from "@/lib/loi";

type Tx = Prisma.TransactionClient;

/** Lấy kỳ, chặn nếu không tồn tại hoặc đã chốt (kỳ đã chốt khóa toàn bộ). */
export async function layKyChuaChot(tx: Tx, kyId: string) {
  const ky = await tx.ky.findUnique({ where: { id: kyId } });
  if (!ky) throw new LoiNghiepVu("Kỳ không tồn tại.", 404);
  if (ky.daChot) throw new LoiNghiepVu("Kỳ đã chốt, không thể thay đổi.", 409);
  return ky;
}

/** Sao chép nhiệm vụ, task, bảng xếp loại từ kỳ nguồn sang kỳ đích (không chép đăng ký). */
export async function saoChepKy(tx: Tx, tuKyId: string, sangKyId: string) {
  const nguon = await tx.ky.findUnique({
    where: { id: tuKyId },
    include: { nhiemVus: { include: { tasks: true } }, bacXepLoais: true },
  });
  if (!nguon) throw new LoiNghiepVu("Kỳ nguồn để sao chép không tồn tại.", 404);

  if (nguon.bacXepLoais.length) {
    await tx.bacXepLoai.createMany({
      data: nguon.bacXepLoais.map((b) => ({ kyId: sangKyId, ten: b.ten, diemToiThieu: b.diemToiThieu })),
    });
  }
  for (const nv of nguon.nhiemVus) {
    await tx.nhiemVu.create({
      data: {
        kyId: sangKyId,
        ten: nv.ten,
        moTa: nv.moTa,
        diem: nv.diem,
        thuTu: nv.thuTu,
        tasks: { create: nv.tasks.map((t) => ({ ten: t.ten, moTa: t.moTa, loai: t.loai, thuTu: t.thuTu })) },
      },
    });
  }
}

/** Số đăng ký (mọi trạng thái) đã chọn nhiệm vụ này. */
export function soDangKyCuaNhiemVu(tx: Tx, nhiemVuId: string) {
  return tx.dangKyNhiemVu.count({ where: { nhiemVuId } });
}

/** Nhiệm vụ đã có đăng ký Đã duyệt → task bắt buộc đã được giao cho GV. */
export async function nhiemVuDaCoDangKyDuyet(tx: Tx, nhiemVuId: string) {
  const n = await tx.dangKyNhiemVu.count({ where: { nhiemVuId, dangKy: { trangThai: "DA_DUYET" } } });
  return n > 0;
}

/** Task đã có GV làm hoặc xin làm. */
export async function taskDaCoNguoiLam(tx: Tx, taskId: string) {
  const gv = await tx.gvTask.count({ where: { taskId } });
  const yc = await tx.yeuCauThemTask.count({ where: { taskId } });
  return gv + yc > 0;
}
