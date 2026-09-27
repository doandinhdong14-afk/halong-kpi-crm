// Quyền xem file qua GET /api/files/[id] (ghi chú 12.2):
// - Minh chứng của X: X, người duyệt của X, người chốt của X chỉ khi task ở CHO_CHOT / DA_CHOT / TRA_VE
//   (task HP: HT luôn xem được), Admin.
// - File quy định: HT, người có vị trí được tick, Admin.
import "server-only";
import type { NguoiDung } from "@/lib/auth/dal";
import { nguoiChot, nguoiDuyet } from "@/lib/co-cau";
import { db } from "@/lib/db";
import { laGop } from "@/lib/kpi/trang-thai";
import { LoiNghiepVu } from "@/lib/loi";
import { laDoiTuong } from "@/lib/roles";
import { taiCoCau } from "@/lib/services/co-cau";

const NGUOI_CHOT_THAY = ["CHO_CHOT", "DA_CHOT", "TRA_VE"];

/** Trả về file nếu u được xem; không có → 404, không có quyền → 403. */
export async function layFileDuocXem(u: NguoiDung, fileId: string) {
  const file = await db.fileDinhKem.findUnique({
    where: { id: fileId },
    include: {
      baiNop: {
        select: {
          kpiTask: {
            select: {
              userId: true,
              trangThai: true,
              user: { select: { id: true, role: true, boMonId: true, khoaId: true } },
            },
          },
        },
      },
      vanBan: { select: { viTriNhan: true } },
    },
  });
  if (!file) throw new LoiNghiepVu("Không tìm thấy file.", 404);
  if (u.role === "ADMIN") return file;

  if (file.baiNop) {
    const kt = file.baiNop.kpiTask;
    if (kt.userId === u.id) return file;
    const cc = await taiCoCau();
    if (nguoiDuyet(kt.user, cc)?.id === u.id) return file;
    const gop = laDoiTuong(kt.user.role) && laGop(kt.user.role);
    if (nguoiChot(kt.user, cc)?.id === u.id && (gop || NGUOI_CHOT_THAY.includes(kt.trangThai))) return file;
  } else if (file.vanBan) {
    if (u.role === "HT" || file.vanBan.viTriNhan.includes(u.role)) return file;
  }
  throw new LoiNghiepVu("Bạn không có quyền xem file này.", 403);
}
