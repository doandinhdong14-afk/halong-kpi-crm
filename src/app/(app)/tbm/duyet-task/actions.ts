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

async function xuLyBaiNop(tbm: NguoiDung, baiNopId: string, ketQua: Exclude<TrangThaiDuyet, "CHO_DUYET">, nhanXet: string | null) {
  await db.$transaction(async (tx) => {
    const bn = await tx.baiNop.findUnique({
      where: { id: baiNopId },
      include: { gvTask: { include: { ky: true, task: true, gv: { select: { boMonId: true } } } } },
    });
    if (!bn || !tbm.boMonId || bn.gvTask.gv.boMonId !== tbm.boMonId) throw new LoiNghiepVu("Không tìm thấy lần nộp.", 404);
    chan(lyDoKhongThaoTacTask(bn.gvTask.ky));
    if (bn.trangThai !== "CHO_DUYET") throw new LoiNghiepVu("Lần nộp không ở trạng thái Chờ duyệt.", 409);

    const { count } = await tx.baiNop.updateMany({
      where: { id: bn.id, trangThai: "CHO_DUYET" },
      data: { trangThai: ketQua, nhanXet, nguoiDuyetId: tbm.id, duyetLuc: new Date() },
    });
    if (!count) throw new LoiNghiepVu("Lần nộp vừa được xử lý, vui lòng tải lại trang.", 409);
    // Trạng thái GvTask luôn đồng bộ với lần nộp mới nhất.
    await tx.gvTask.update({ where: { id: bn.gvTaskId }, data: { trangThai: ketQua } });

    const ten = bn.gvTask.task.ten;
    await guiThongBao(
      tx,
      [bn.gvTask.gvId],
      ketQua === "DA_DUYET"
        ? `Minh chứng task "${ten}" đã được duyệt.`
        : `Minh chứng task "${ten}" bị từ chối. Nhận xét: ${nhanXet}`,
      `/gv/cuoi-ky/task/${bn.gvTaskId}`,
    );
  });
}

export async function duyetBaiNop(input: { baiNopId: string; nhanXet?: string }) {
  return hanhDong(async () => {
    const tbm = await kiemTraVaiTro("TBM");
    await xuLyBaiNop(tbm, input.baiNopId, "DA_DUYET", docDuLieu(NhanXetTuyChon, input.nhanXet));
  });
}

export async function tuChoiBaiNop(input: { baiNopId: string; nhanXet: string }) {
  return hanhDong(async () => {
    const tbm = await kiemTraVaiTro("TBM");
    await xuLyBaiNop(tbm, input.baiNopId, "TU_CHOI", docDuLieu(NhanXetBatBuoc, input.nhanXet));
  });
}
