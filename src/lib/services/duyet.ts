// Dữ liệu cho màn hình Duyệt dùng chung (mục 6.1): TBM → GV, TK → TBM, HP → TK, HT → HP.
// Chỉ gồm những người mà m là người duyệt, tính theo cơ cấu hiện tại.
import "server-only";
import type { TrangThaiDangKy, TrangThaiTask } from "@/generated/prisma/enums";
import type { NguoiDung } from "@/lib/auth/dal";
import { nguoiToiDuyet, type NguoiCoCau } from "@/lib/co-cau";
import { db } from "@/lib/db";
import { layCoCau } from "@/lib/services/co-cau";

/** Người mà m là người duyệt, theo id; không phải → null (trang trả 404). */
export async function layNguoiDuocDuyet(m: NguoiDung, nguoiId: string): Promise<NguoiCoCau | null> {
  const cc = await layCoCau();
  return nguoiToiDuyet(m, cc).find((x) => x.id === nguoiId) ?? null;
}

export type DongTongQuan = {
  nguoi: NguoiCoCau;
  dangKy: { trangThai: TrangThaiDangKy; xepLoai: string | null; tongDiem: number } | null;
  demTask: Partial<Record<TrangThaiTask, number>>;
  xinThemChoDuyet: number;
};

/** Bảng người + số liệu cho tab Tổng quan trong một kỳ. */
export async function tongQuanDuyet(m: NguoiDung, kyId: string): Promise<DongTongQuan[]> {
  const cc = await layCoCau();
  const ds = nguoiToiDuyet(m, cc);
  const ids = ds.map((x) => x.id);
  const [dangKys, tasks, yeuCaus] = await Promise.all([
    db.dangKy.findMany({
      where: { kyId, userId: { in: ids } },
      select: { userId: true, trangThai: true, xepLoai: true, tongDiem: true },
    }),
    db.kpiTask.groupBy({ by: ["userId", "trangThai"], where: { kyId, userId: { in: ids } }, _count: true }),
    db.yeuCauThemTask.groupBy({ by: ["userId"], where: { kyId, userId: { in: ids }, trangThai: "CHO_DUYET" }, _count: true }),
  ]);
  return ds.map((nguoi) => {
    const dk = dangKys.find((d) => d.userId === nguoi.id);
    return {
      nguoi,
      dangKy: dk ? { trangThai: dk.trangThai, xepLoai: dk.xepLoai, tongDiem: dk.tongDiem } : null,
      demTask: Object.fromEntries(tasks.filter((t) => t.userId === nguoi.id).map((t) => [t.trangThai, t._count])),
      xinThemChoDuyet: yeuCaus.find((y) => y.userId === nguoi.id)?._count ?? 0,
    };
  });
}
