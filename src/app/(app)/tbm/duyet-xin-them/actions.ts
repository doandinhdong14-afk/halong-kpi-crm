"use server";

import { z } from "zod";
import type { TrangThaiDuyet } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { kiemTraVaiTro, type NguoiDung } from "@/lib/auth/dal";
import { chan, hanhDong, LoiNghiepVu } from "@/lib/loi";
import { lyDoKhongThaoTacTask } from "@/lib/rules";
import { guiThongBao } from "@/lib/thong-bao";
import { docDuLieu } from "@/lib/validate";

const NhanXetBatBuoc = z.string().trim().min(1, "Vui lòng nhập nhận xét khi từ chối.").max(2000);
const NhanXetTuyChon = z.string().trim().max(2000).optional().transform((s) => s || null);

async function xuLyYeuCau(tbm: NguoiDung, yeuCauId: string, ketQua: Exclude<TrangThaiDuyet, "CHO_DUYET">, nhanXet: string | null) {
  await db.$transaction(async (tx) => {
    const yc = await tx.yeuCauThemTask.findUnique({
      where: { id: yeuCauId },
      include: { ky: true, task: true, gv: { select: { boMonId: true } } },
    });
    if (!yc || !tbm.boMonId || yc.gv.boMonId !== tbm.boMonId) throw new LoiNghiepVu("Không tìm thấy yêu cầu.", 404);
    chan(lyDoKhongThaoTacTask(yc.ky));
    if (yc.trangThai !== "CHO_DUYET") throw new LoiNghiepVu("Yêu cầu không ở trạng thái Chờ duyệt.", 409);

    const { count } = await tx.yeuCauThemTask.updateMany({
      where: { id: yc.id, trangThai: "CHO_DUYET" },
      data: { trangThai: ketQua, nhanXet, nguoiDuyetId: tbm.id, duyetLuc: new Date() },
    });
    if (!count) throw new LoiNghiepVu("Yêu cầu vừa được xử lý, vui lòng tải lại trang.", 409);

    if (ketQua === "DA_DUYET") {
      // Task mở rộng được thêm vào danh sách của GV, đi đúng vòng trạng thái như task thường.
      await tx.gvTask.createMany({ data: [{ gvId: yc.gvId, kyId: yc.kyId, taskId: yc.taskId }], skipDuplicates: true });
    }
    await guiThongBao(
      tx,
      [yc.gvId],
      ketQua === "DA_DUYET"
        ? `Yêu cầu làm thêm task "${yc.task.ten}" đã được duyệt.`
        : `Yêu cầu làm thêm task "${yc.task.ten}" bị từ chối. Nhận xét: ${nhanXet}`,
      `/gv/cuoi-ky?kyId=${yc.kyId}`,
    );
  });
}

export async function duyetYeuCau(input: { yeuCauId: string; nhanXet?: string }) {
  return hanhDong(async () => {
    const tbm = await kiemTraVaiTro("TBM");
    await xuLyYeuCau(tbm, input.yeuCauId, "DA_DUYET", docDuLieu(NhanXetTuyChon, input.nhanXet));
  });
}

export async function tuChoiYeuCau(input: { yeuCauId: string; nhanXet: string }) {
  return hanhDong(async () => {
    const tbm = await kiemTraVaiTro("TBM");
    await xuLyYeuCau(tbm, input.yeuCauId, "TU_CHOI", docDuLieu(NhanXetBatBuoc, input.nhanXet));
  });
}
