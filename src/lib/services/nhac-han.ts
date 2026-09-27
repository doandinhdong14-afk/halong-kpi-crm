import "server-only";
import { db } from "@/lib/db";
import { guiThongBao } from "@/lib/thong-bao";
import { deadline, hanDangKy, hienNgayGio, soNgayConLai } from "@/lib/time";

const NGAY_NHAC_DANG_KY = 3;
const NGAY_NHAC_DEADLINE = 7;

function conLai(n: number) {
  return n === 0 ? "Hôm nay là ngày cuối" : `Còn ${n} ngày`;
}

/**
 * Nhắc hạn (mục 10, quyết định #9), chạy cùng cron mỗi ngày:
 * - còn ≤3 ngày đến hạn đăng ký → GV chưa gửi (chưa có đăng ký hoặc Nháp);
 * - còn ≤7 ngày đến deadline → GV còn task bắt buộc chưa Đã duyệt.
 * Mỗi loại 1 lần / GV / kỳ (ThongBao.maSuKien); dùng "≤" để cron lỡ 1 ngày vẫn nhắc.
 */
export async function guiNhacHan(now: Date = new Date()): Promise<{ hanDangKy: number; deadline: number }> {
  const kys = await db.ky.findMany({ where: { daCongBo: true, daChot: false } });
  const gvs = await db.user.findMany({ where: { role: "GV" }, select: { id: true } });
  let soDangKy = 0;
  let soDeadline = 0;

  for (const ky of kys) {
    const nDk = soNgayConLai(ky.ngayBatDau, now);
    if (nDk >= 0 && nDk <= NGAY_NHAC_DANG_KY && now <= hanDangKy(ky)) {
      const daGui = await db.dangKy.findMany({
        where: { kyId: ky.id, trangThai: { not: "NHAP" } },
        select: { gvId: true },
      });
      const boQua = new Set(daGui.map((d) => d.gvId));
      soDangKy += await guiThongBao(
        db,
        gvs.filter((g) => !boQua.has(g.id)).map((g) => g.id),
        `${conLai(nDk)} đến hạn đăng ký nhiệm vụ ${ky.ten} (${hienNgayGio(hanDangKy(ky))}).`,
        `/gv/dau-ky?kyId=${ky.id}`,
        `nhac-han-dang-ky:${ky.id}`,
      );
    }

    const nDl = soNgayConLai(ky.ngayKetThuc, now);
    if (nDl >= 0 && nDl <= NGAY_NHAC_DEADLINE && now <= deadline(ky)) {
      const conThieu = await db.gvTask.findMany({
        where: { kyId: ky.id, trangThai: { not: "DA_DUYET" }, task: { loai: "BAT_BUOC" }, gv: { role: "GV" } },
        select: { gvId: true },
        distinct: ["gvId"],
      });
      soDeadline += await guiThongBao(
        db,
        conThieu.map((g) => g.gvId),
        `${conLai(nDl)} đến deadline ${ky.ten} (${hienNgayGio(deadline(ky))}). Bạn còn task bắt buộc chưa được duyệt.`,
        `/gv/cuoi-ky?kyId=${ky.id}`,
        `nhac-deadline:${ky.id}`,
      );
    }
  }
  return { hanDangKy: soDangKy, deadline: soDeadline };
}
