"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { chan, hanhDong, LoiNghiepVu } from "@/lib/loi";
import { lyDoKhongDuyetDangKy } from "@/lib/rules";
import { guiThongBao } from "@/lib/thong-bao";
import { docDuLieu } from "@/lib/validate";
import { tinhXepLoai } from "@/lib/xep-loai";

const NhanXetBatBuoc = z.string().trim().min(1, "Vui lòng nhập nhận xét khi từ chối.").max(2000);
const NhanXetTuyChon = z.string().trim().max(2000).optional().transform((s) => s || null);

/** Duyệt cả danh sách: tính lại điểm/xếp loại, giao các task bắt buộc cho GV (trạng thái Chưa làm). */
export async function duyetDangKy(input: { dangKyId: string; nhanXet?: string }) {
  return hanhDong(async () => {
    const tbm = await kiemTraVaiTro("TBM");
    const nhanXet = docDuLieu(NhanXetTuyChon, input.nhanXet);
    return db.$transaction(async (tx) => {
      const dk = await tx.dangKy.findUnique({
        where: { id: input.dangKyId },
        include: {
          gv: { select: { boMonId: true } },
          ky: { include: { bacXepLoais: true } },
          nhiemVus: { include: { nhiemVu: { include: { tasks: { where: { loai: "BAT_BUOC" }, select: { id: true } } } } } },
        },
      });
      if (!dk || !tbm.boMonId || dk.gv.boMonId !== tbm.boMonId) throw new LoiNghiepVu("Không tìm thấy danh sách đăng ký.", 404);
      chan(lyDoKhongDuyetDangKy(dk.ky));
      if (dk.trangThai !== "CHO_DUYET") throw new LoiNghiepVu("Danh sách không ở trạng thái Chờ duyệt.", 409);

      // Mục 9.2: tính lại khi TBM duyệt (theo bảng xếp loại hiện tại).
      const tongDiem = dk.nhiemVus.reduce((s, x) => s + x.nhiemVu.diem, 0);
      const xepLoai = tinhXepLoai(tongDiem, dk.ky.bacXepLoais);
      const { count } = await tx.dangKy.updateMany({
        where: { id: dk.id, trangThai: "CHO_DUYET" },
        data: { trangThai: "DA_DUYET", tongDiem, xepLoai, nhanXet, nguoiDuyetId: tbm.id, duyetLuc: new Date() },
      });
      if (!count) throw new LoiNghiepVu("Danh sách vừa được người khác xử lý, vui lòng tải lại trang.", 409);

      const taskIds = dk.nhiemVus.flatMap((x) => x.nhiemVu.tasks.map((t) => t.id));
      await tx.gvTask.createMany({
        data: taskIds.map((taskId) => ({ gvId: dk.gvId, kyId: dk.kyId, taskId })),
        skipDuplicates: true,
      });

      await guiThongBao(
        tx,
        [dk.gvId],
        `Danh sách đăng ký nhiệm vụ ${dk.ky.ten} đã được duyệt (${tongDiem} điểm, xếp loại ${xepLoai}).`,
        `/gv/cuoi-ky?kyId=${dk.kyId}`,
      );
      return { soTask: taskIds.length };
    });
  });
}

/** Từ chối cả danh sách (bắt buộc nhận xét). GV được sửa và gửi lại đến hết deadline. */
export async function tuChoiDangKy(input: { dangKyId: string; nhanXet: string }) {
  return hanhDong(async () => {
    const tbm = await kiemTraVaiTro("TBM");
    const nhanXet = docDuLieu(NhanXetBatBuoc, input.nhanXet);
    await db.$transaction(async (tx) => {
      const dk = await tx.dangKy.findUnique({
        where: { id: input.dangKyId },
        include: { gv: { select: { boMonId: true } }, ky: true },
      });
      if (!dk || !tbm.boMonId || dk.gv.boMonId !== tbm.boMonId) throw new LoiNghiepVu("Không tìm thấy danh sách đăng ký.", 404);
      chan(lyDoKhongDuyetDangKy(dk.ky));
      if (dk.trangThai !== "CHO_DUYET") throw new LoiNghiepVu("Danh sách không ở trạng thái Chờ duyệt.", 409);

      const { count } = await tx.dangKy.updateMany({
        where: { id: dk.id, trangThai: "CHO_DUYET" },
        data: { trangThai: "TU_CHOI", nhanXet, nguoiDuyetId: tbm.id, duyetLuc: new Date() },
      });
      if (!count) throw new LoiNghiepVu("Danh sách vừa được người khác xử lý, vui lòng tải lại trang.", 409);

      await guiThongBao(
        tx,
        [dk.gvId],
        `Danh sách đăng ký nhiệm vụ ${dk.ky.ten} bị từ chối. Nhận xét: ${nhanXet}`,
        `/gv/dau-ky?kyId=${dk.kyId}`,
      );
    });
  });
}
