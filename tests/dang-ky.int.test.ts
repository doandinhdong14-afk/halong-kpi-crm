import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { chonNhiemVu, guiDangKy } from "@/app/(app)/gv/dau-ky/actions";
import { duyetDangKy, tuChoiDangKy } from "@/app/(app)/tbm/duyet-dang-ky/actions";
import { db } from "@/lib/db";
import { chuoiThanhNgay, congNgay, homNayVN } from "@/lib/time";
import { dangNhapNhu, resetDb, user } from "./helpers";

let kyId: string;
let nv: { id: string; diem: number; thuTu: number }[];

async function datNgayKy(batDauLech: number, ketThucLech: number) {
  const h = homNayVN();
  await db.ky.update({
    where: { id: kyId },
    data: { ngayBatDau: chuoiThanhNgay(congNgay(h, batDauLech)), ngayKetThuc: chuoiThanhNgay(congNgay(h, ketThucLech)) },
  });
}

async function dangKyCua(username: string) {
  const u = await user(username);
  return db.dangKy.findUnique({ where: { kyId_gvId: { kyId, gvId: u.id } }, include: { nhiemVus: true } });
}

async function chonVaGui(username: string, thuTus: number[]) {
  await dangNhapNhu(username);
  for (const t of thuTus) {
    const r = await chonNhiemVu({ kyId, nhiemVuId: nv.find((x) => x.thuTu === t)!.id, chon: true });
    expect(r.ok).toBe(true);
  }
  return guiDangKy(kyId);
}

beforeAll(async () => {
  await resetDb();
  const ky = await db.ky.findFirstOrThrow({ include: { nhiemVus: true } });
  kyId = ky.id;
  nv = ky.nhiemVus;
});

beforeEach(async () => {
  await db.ky.update({ where: { id: kyId }, data: { daChot: false } });
  await datNgayKy(0, 30);
});

describe("GV đăng ký + TBM duyệt (bước 4)", () => {
  it("chọn tự lưu, bỏ chọn; gửi 0 nhiệm vụ bị chặn; chỉ GV gọi được", async () => {
    await dangNhapNhu("tbm.phamthibich");
    expect((await chonNhiemVu({ kyId, nhiemVuId: nv[0].id, chon: true })).ok).toBe(false);

    await dangNhapNhu("gv.levancuong");
    expect(await guiDangKy(kyId)).toEqual({ ok: false, error: "Phải chọn ít nhất 1 nhiệm vụ mới gửi được." });
    await chonNhiemVu({ kyId, nhiemVuId: nv[0].id, chon: true });
    await chonNhiemVu({ kyId, nhiemVuId: nv[0].id, chon: false });
    expect((await dangKyCua("gv.levancuong"))?.nhiemVus).toHaveLength(0);
    expect(await guiDangKy(kyId)).toEqual({ ok: false, error: "Phải chọn ít nhất 1 nhiệm vụ mới gửi được." });
  });

  it("gửi: lưu tổng điểm + xếp loại, TBM nhận thông báo; Chờ duyệt thì khóa", async () => {
    const r = await chonVaGui("gv.tranthibinh", [1, 2, 3]);
    expect(r).toEqual({ ok: true, data: { tongDiem: 39, xepLoai: "C" } });
    const dk = await dangKyCua("gv.tranthibinh");
    expect(dk).toMatchObject({ trangThai: "CHO_DUYET", tongDiem: 39, xepLoai: "C" });

    const tbm = await user("tbm.phamthibich");
    const tb = await db.thongBao.findMany({ where: { userId: tbm.id } });
    expect(tb.some((t) => t.noiDung.includes("Trần Thị Bình") && t.link === `/tbm/duyet-dang-ky/${dk!.id}`)).toBe(true);

    expect((await chonNhiemVu({ kyId, nhiemVuId: nv[5].id, chon: true })).ok).toBe(false);
    expect((await guiDangKy(kyId)).ok).toBe(false);
  });

  it("TBM từ chối bắt buộc nhận xét; GV sửa + gửi lại sau ngày bắt đầu (trước deadline)", async () => {
    await dangNhapNhu("tbm.phamthibich");
    const dk = (await dangKyCua("gv.tranthibinh"))!;
    expect(await tuChoiDangKy({ dangKyId: dk.id, nhanXet: "  " })).toEqual({
      ok: false,
      error: "Vui lòng nhập nhận xét khi từ chối.",
    });
    expect((await tuChoiDangKy({ dangKyId: dk.id, nhanXet: "Chọn thêm nhiệm vụ" })).ok).toBe(true);
    const gv = await user("gv.tranthibinh");
    expect(await db.thongBao.count({ where: { userId: gv.id, noiDung: { contains: "bị từ chối" } } })).toBe(1);

    // Hạn đăng ký đã qua (ngày bắt đầu = hôm qua) nhưng trạng thái Bị từ chối → vẫn sửa + gửi lại được.
    await datNgayKy(-1, 30);
    await dangNhapNhu("gv.tranthibinh");
    expect((await chonNhiemVu({ kyId, nhiemVuId: nv.find((x) => x.thuTu === 4)!.id, chon: true })).ok).toBe(true);
    expect((await dangKyCua("gv.tranthibinh"))?.trangThai).toBe("TU_CHOI"); // A2: sửa không về Nháp
    expect((await chonNhiemVu({ kyId, nhiemVuId: nv.find((x) => x.thuTu === 4)!.id, chon: false })).ok).toBe(true);
    const r = await guiDangKy(kyId);
    expect(r).toEqual({ ok: true, data: { tongDiem: 39, xepLoai: "C" } });
  });

  it("TBM duyệt → Đã duyệt, giao task bắt buộc (Chưa làm), GV không đổi được nữa", async () => {
    await dangNhapNhu("tbm.phamthibich");
    const dk = (await dangKyCua("gv.tranthibinh"))!;
    const r = await duyetDangKy({ dangKyId: dk.id });
    // Nhiệm vụ 1 (3 task BB) + 2 (2) + 3 (2) = 7 task bắt buộc
    expect(r).toEqual({ ok: true, data: { soTask: 7 } });
    const gv = await user("gv.tranthibinh");
    const tasks = await db.gvTask.findMany({ where: { gvId: gv.id, kyId }, include: { task: true } });
    expect(tasks).toHaveLength(7);
    expect(tasks.every((t) => t.trangThai === "CHUA_LAM" && t.task.loai === "BAT_BUOC")).toBe(true);

    expect(await duyetDangKy({ dangKyId: dk.id })).toEqual({ ok: false, error: "Danh sách không ở trạng thái Chờ duyệt." });
    await dangNhapNhu("gv.tranthibinh");
    expect(await chonNhiemVu({ kyId, nhiemVuId: nv[8].id, chon: true })).toEqual({
      ok: false,
      error: "Danh sách đã được duyệt, không thể thay đổi nhiệm vụ.",
    });
  });

  it("case phụ: ngày bắt đầu = hôm qua → GV chưa gửi không gửi được nữa", async () => {
    await dangNhapNhu("gv.nguyenvanan");
    expect((await chonNhiemVu({ kyId, nhiemVuId: nv[0].id, chon: true })).ok).toBe(true);
    await datNgayKy(-1, 30);
    expect(await guiDangKy(kyId)).toEqual({ ok: false, error: "Đã hết hạn đăng ký (23:59 ngày bắt đầu kỳ)." });
    expect((await chonNhiemVu({ kyId, nhiemVuId: nv[1].id, chon: true })).ok).toBe(false);
  });

  it("hết deadline: TBM không duyệt được; kỳ đã chốt: mọi thao tác bị chặn", async () => {
    const r = await chonVaGui("gv.levancuong", [1, 2, 3, 4, 5]);
    expect(r).toEqual({ ok: true, data: { tongDiem: 59, xepLoai: "B" } });
    const dk = (await dangKyCua("gv.levancuong"))!;

    await datNgayKy(-31, -1);
    await dangNhapNhu("tbm.phamthibich");
    expect(await duyetDangKy({ dangKyId: dk.id })).toEqual({ ok: false, error: "Đã hết deadline của kỳ, không thể duyệt." });

    await datNgayKy(0, 30);
    await db.ky.update({ where: { id: kyId }, data: { daChot: true } });
    expect(await tuChoiDangKy({ dangKyId: dk.id, nhanXet: "x" })).toEqual({ ok: false, error: "Kỳ đã chốt, không thể thao tác." });
    await dangNhapNhu("gv.nguyenvanan");
    expect(await chonNhiemVu({ kyId, nhiemVuId: nv[2].id, chon: true })).toEqual({
      ok: false,
      error: "Kỳ đã chốt, không thể thao tác.",
    });
  });

  it("TBM bộ môn khác không duyệt được", async () => {
    const khoa = await db.khoa.findFirstOrThrow();
    const bm2 = await db.boMon.create({ data: { ten: "Bộ môn khác", khoaId: khoa.id } });
    const tbm = await user("tbm.phamthibich");
    await db.user.create({
      data: { username: "tbm.nguoikhac", hoTen: "Người khác", role: "TBM", passwordHash: tbm.passwordHash, boMonId: bm2.id },
    });
    const dk = (await dangKyCua("gv.levancuong"))!;
    await dangNhapNhu("tbm.nguoikhac");
    expect(await duyetDangKy({ dangKyId: dk.id })).toEqual({ ok: false, error: "Không tìm thấy danh sách đăng ký." });
  });
});
