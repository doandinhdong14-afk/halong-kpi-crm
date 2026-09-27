import "server-only";
import { db } from "@/lib/db";
import { tinhKetQuaGv } from "@/lib/ket-qua";
import { NHAN_KET_QUA } from "@/lib/nhan";
import { guiThongBao } from "@/lib/thong-bao";
import { homNayVN, ngayThanhChuoi } from "@/lib/time";
import { bacThapNhat } from "@/lib/xep-loai";

/**
 * Chốt kỳ (mục 9.3): tính kết quả cho mọi tài khoản đang là GV, lưu KetQuaKy, đặt daChot,
 * gửi thông báo cho GV và TBM. Chạy hai lần không nhân đôi (daChot đặt có điều kiện).
 * Trả về null nếu kỳ không tồn tại / chưa công bố / đã chốt.
 */
export async function chotKy(kyId: string): Promise<{ soGv: number } | null> {
  return db.$transaction(
    async (tx) => {
      const { count } = await tx.ky.updateMany({
        where: { id: kyId, daCongBo: true, daChot: false },
        data: { daChot: true },
      });
      if (!count) return null;

      const ky = await tx.ky.findUniqueOrThrow({ where: { id: kyId }, include: { bacXepLoais: true } });
      const thapNhat = bacThapNhat(ky.bacXepLoais);
      const gvs = await tx.user.findMany({ where: { role: "GV" }, select: { id: true } });

      for (const gv of gvs) {
        const dangKy = await tx.dangKy.findUnique({
          where: { kyId_gvId: { kyId, gvId: gv.id } },
          select: { trangThai: true, xepLoai: true },
        });
        const gvTasks = await tx.gvTask.findMany({
          where: { kyId, gvId: gv.id },
          include: { task: { select: { ten: true, loai: true, thuTu: true, nhiemVu: { select: { ten: true, thuTu: true } } } } },
        });
        gvTasks.sort((a, b) => a.task.nhiemVu.thuTu - b.task.nhiemVu.thuTu || a.task.thuTu - b.task.thuTu);
        const kq = tinhKetQuaGv({
          dangKy,
          tasks: gvTasks.map((g) => ({ ten: g.task.ten, nhiemVu: g.task.nhiemVu.ten, loai: g.task.loai, trangThai: g.trangThai })),
          bacThapNhat: thapNhat,
        });
        const data = {
          phanTram: kq.phanTram,
          ketQua: kq.ketQua,
          xepLoai: kq.xepLoai,
          taskThieu: kq.taskThieu,
          taskVuot: kq.taskVuot,
          ghiChu: kq.ghiChu,
          chotLuc: new Date(),
        };
        await tx.ketQuaKy.upsert({
          where: { kyId_gvId: { kyId, gvId: gv.id } },
          create: { kyId, gvId: gv.id, ...data },
          update: data,
        });
        await guiThongBao(
          tx,
          [gv.id],
          `${ky.ten} đã chốt. Kết quả của bạn: ${NHAN_KET_QUA[kq.ketQua]} – ${kq.xepLoai}.`,
          `/gv/cuoi-ky?kyId=${kyId}`,
        );
      }

      const tbms = await tx.user.findMany({ where: { role: "TBM" }, select: { id: true } });
      await guiThongBao(tx, tbms.map((t) => t.id), `${ky.ten} đã chốt, đã có kết quả của giáo viên.`, `/tbm/ket-qua?kyId=${kyId}`);
      return { soGv: gvs.length };
    },
    { timeout: 120_000, maxWait: 10_000 },
  );
}

/** Chốt mọi kỳ đã công bố, chưa chốt, đã quá deadline (dùng cho cron). */
export async function chotCacKyQuaHan(now: Date = new Date()) {
  const homNay = homNayVN(now);
  const kys = await db.ky.findMany({ where: { daCongBo: true, daChot: false }, select: { id: true, ten: true, ngayKetThuc: true } });
  // Quá deadline (23:59:59 ngày kết thúc, giờ VN) ⇔ hôm nay (VN) sau ngày kết thúc.
  const quaHan = kys.filter((k) => ngayThanhChuoi(k.ngayKetThuc) < homNay);
  const daChot: { id: string; ten: string; soGv: number }[] = [];
  for (const k of quaHan) {
    const r = await chotKy(k.id);
    if (r) daChot.push({ id: k.id, ten: k.ten, soGv: r.soGv });
  }
  return daChot;
}
