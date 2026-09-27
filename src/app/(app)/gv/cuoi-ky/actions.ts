"use server";

import { db } from "@/lib/db";
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { chan, hanhDong, LoiNghiepVu } from "@/lib/loi";
import { lyDoKhongThaoTacTask } from "@/lib/rules";
import { guiThongBao, tbmCuaBoMon } from "@/lib/thong-bao";

/**
 * GV xin làm thêm một task mở rộng (làm vượt). Task phải thuộc nhiệm vụ GV đã được duyệt.
 * Xin lại được sau khi bị từ chối (B17), không được khi đang chờ hoặc đã được giao.
 */
export async function xinThemTask(taskId: string) {
  return hanhDong(async () => {
    const gv = await kiemTraVaiTro("GV");
    await db.$transaction(async (tx) => {
      const task = await tx.task.findUnique({ where: { id: taskId }, include: { nhiemVu: { include: { ky: true } } } });
      if (!task || task.loai !== "MO_RONG") throw new LoiNghiepVu("Không tìm thấy task mở rộng.", 404);
      const ky = task.nhiemVu.ky;
      chan(lyDoKhongThaoTacTask(ky));

      const dk = await tx.dangKy.findUnique({
        where: { kyId_gvId: { kyId: ky.id, gvId: gv.id } },
        include: { nhiemVus: { where: { nhiemVuId: task.nhiemVuId } } },
      });
      if (!dk || dk.trangThai !== "DA_DUYET" || dk.nhiemVus.length === 0) {
        throw new LoiNghiepVu("Chỉ xin được task mở rộng thuộc nhiệm vụ bạn đã được duyệt.", 403);
      }
      if (await tx.gvTask.findUnique({ where: { gvId_taskId: { gvId: gv.id, taskId } } })) {
        throw new LoiNghiepVu("Task này đã có trong danh sách của bạn.", 409);
      }
      const dangCho = await tx.yeuCauThemTask.findFirst({ where: { gvId: gv.id, taskId, trangThai: "CHO_DUYET" } });
      if (dangCho) throw new LoiNghiepVu("Bạn đã xin task này, đang chờ trưởng bộ môn duyệt.", 409);

      await tx.yeuCauThemTask.create({ data: { gvId: gv.id, kyId: ky.id, taskId } });
      await guiThongBao(
        tx,
        await tbmCuaBoMon(tx, gv.boMonId),
        `${gv.hoTen} xin làm thêm task mở rộng "${task.ten}".`,
        "/tbm/duyet-xin-them",
      );
    });
  });
}
