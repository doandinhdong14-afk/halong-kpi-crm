"use server";

import { db } from "@/lib/db";
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { chan, hanhDong, LoiNghiepVu } from "@/lib/loi";
import { lyDoKhongSuaDangKy } from "@/lib/rules";
import { guiThongBao, tbmCuaBoMon } from "@/lib/thong-bao";
import { tinhXepLoai } from "@/lib/xep-loai";

/** Tick / bỏ tick một nhiệm vụ (tự lưu). Tạo danh sách Nháp nếu chưa có. */
export async function chonNhiemVu(input: { kyId: string; nhiemVuId: string; chon: boolean }) {
  return hanhDong(async () => {
    const gv = await kiemTraVaiTro("GV");
    await db.$transaction(async (tx) => {
      const ky = await tx.ky.findUnique({ where: { id: input.kyId } });
      if (!ky) throw new LoiNghiepVu("Kỳ không tồn tại.", 404);
      const nv = await tx.nhiemVu.findFirst({ where: { id: input.nhiemVuId, kyId: ky.id }, select: { id: true } });
      if (!nv) throw new LoiNghiepVu("Nhiệm vụ không thuộc kỳ này.", 404);

      // Tạo Nháp nếu chưa có, rồi khóa dòng để đọc trạng thái chắc chắn.
      await tx.dangKy.upsert({
        where: { kyId_gvId: { kyId: ky.id, gvId: gv.id } },
        create: { kyId: ky.id, gvId: gv.id },
        update: {},
      });
      const [dk] = await tx.$queryRaw<{ id: string; trangThai: "NHAP" | "CHO_DUYET" | "TU_CHOI" | "DA_DUYET" }[]>`
        SELECT id, "trangThai" FROM "DangKy" WHERE "kyId" = ${ky.id} AND "gvId" = ${gv.id} FOR UPDATE`;
      chan(lyDoKhongSuaDangKy(ky, dk.trangThai));

      if (input.chon) {
        await tx.dangKyNhiemVu.createMany({ data: [{ dangKyId: dk.id, nhiemVuId: nv.id }], skipDuplicates: true });
      } else {
        await tx.dangKyNhiemVu.deleteMany({ where: { dangKyId: dk.id, nhiemVuId: nv.id } });
      }
    });
  }, false);
}

/** Gửi danh sách lên TBM (lần đầu hoặc gửi lại sau khi bị từ chối). */
export async function guiDangKy(kyId: string) {
  return hanhDong(async () => {
    const gv = await kiemTraVaiTro("GV");
    const ketQua = await db.$transaction(async (tx) => {
      const ky = await tx.ky.findUnique({ where: { id: kyId }, include: { bacXepLoais: true } });
      if (!ky) throw new LoiNghiepVu("Kỳ không tồn tại.", 404);
      const dk = await tx.dangKy.findUnique({
        where: { kyId_gvId: { kyId, gvId: gv.id } },
        include: { nhiemVus: { include: { nhiemVu: { select: { diem: true } } } } },
      });
      chan(lyDoKhongSuaDangKy(ky, dk?.trangThai ?? null));
      if (!dk || dk.nhiemVus.length === 0) throw new LoiNghiepVu("Phải chọn ít nhất 1 nhiệm vụ mới gửi được.");

      const tongDiem = dk.nhiemVus.reduce((s, x) => s + x.nhiemVu.diem, 0);
      const xepLoai = tinhXepLoai(tongDiem, ky.bacXepLoais);
      const { count } = await tx.dangKy.updateMany({
        where: { id: dk.id, trangThai: dk.trangThai },
        data: { trangThai: "CHO_DUYET", tongDiem, xepLoai, nopLuc: new Date(), nhanXet: null },
      });
      if (!count) throw new LoiNghiepVu("Danh sách vừa thay đổi trạng thái, vui lòng tải lại trang.", 409);

      const laGuiLai = dk.trangThai === "TU_CHOI";
      await guiThongBao(
        tx,
        await tbmCuaBoMon(tx, gv.boMonId),
        `${gv.hoTen} đã ${laGuiLai ? "gửi lại" : "gửi"} danh sách đăng ký nhiệm vụ ${ky.ten} (${tongDiem} điểm, ${xepLoai}).`,
        `/tbm/duyet-dang-ky/${dk.id}`,
      );
      return { tongDiem, xepLoai };
    });
    return ketQua;
  });
}
