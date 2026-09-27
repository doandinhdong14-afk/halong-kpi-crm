import { beforeAll, describe, expect, it } from "vitest";
import {
  congBoKy,
  luuBangXepLoai,
  suaNgayKy,
  suaNhiemVu,
  suaTask,
  taoKy,
  themNhiemVu,
  themTask,
  xoaNhiemVu,
  xoaTask,
} from "@/app/(app)/admin/phan-viec/actions";
import { db } from "@/lib/db";
import { dangNhapNhu, resetDb, user } from "./helpers";

let ky1Id: string;

beforeAll(async () => {
  await resetDb();
  ky1Id = (await db.ky.findFirstOrThrow()).id;
});

async function nhiemVu(thuTu: number) {
  return db.nhiemVu.findFirstOrThrow({ where: { kyId: ky1Id, thuTu }, include: { tasks: { orderBy: { thuTu: "asc" } } } });
}

describe("Phân việc đầu kỳ – chặn ở server", () => {
  it("chỉ ADMIN", async () => {
    await dangNhapNhu("tbm.phamthibich");
    expect((await themNhiemVu({ kyId: ky1Id, ten: "X", diem: 1 })).ok).toBe(false);
    expect((await congBoKy(ky1Id)).ok).toBe(false);
  });

  it("tạo kỳ: sao chép đủ nhiệm vụ, task, bảng xếp loại; kỳ mới chưa công bố", async () => {
    await dangNhapNhu("admin.quantri");
    const r = await taoKy({
      ten: "Kỳ 2 – 2026-2027",
      namHoc: "2026-2027",
      soKy: 2,
      ngayBatDau: "2026-12-01",
      ngayKetThuc: "2027-02-28",
      saoChepTuKyId: ky1Id,
    });
    expect(r.ok).toBe(true);
    const ky2 = await db.ky.findUniqueOrThrow({
      where: { id: r.ok ? r.data.id : "" },
      include: { nhiemVus: { include: { tasks: true } }, bacXepLoais: true },
    });
    expect(ky2.daCongBo).toBe(false);
    expect(ky2.nhiemVus).toHaveLength(10);
    expect(ky2.nhiemVus.reduce((s, n) => s + n.diem, 0)).toBe(100);
    const soTaskNguon = await db.task.count({ where: { nhiemVu: { kyId: ky1Id } } });
    expect(soTaskNguon).toBe(32);
    expect(ky2.nhiemVus.flatMap((n) => n.tasks)).toHaveLength(soTaskNguon);
    expect(ky2.bacXepLoais.map((b) => b.ten).sort()).toEqual(["A1", "A2", "B", "C", "D", "F"]);
  });

  it("tạo kỳ: trùng năm học + kỳ số, ngày kết thúc trước ngày bắt đầu → lỗi", async () => {
    await dangNhapNhu("admin.quantri");
    const trung = await taoKy({ ten: "X", namHoc: "2026-2027", soKy: 1, ngayBatDau: "2027-01-01", ngayKetThuc: "2027-02-01" });
    expect(trung).toEqual({ ok: false, error: "Đã có kỳ 1 của năm học 2026-2027." });
    const sai = await taoKy({ ten: "X", namHoc: "2027-2028", soKy: 1, ngayBatDau: "2027-09-10", ngayKetThuc: "2027-09-01" });
    expect(sai).toEqual({ ok: false, error: "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu." });
  });

  it("công bố cần ≥1 nhiệm vụ và ≥1 bậc", async () => {
    await dangNhapNhu("admin.quantri");
    const r = await taoKy({ ten: "Kỳ 3", namHoc: "2026-2027", soKy: 3, ngayBatDau: "2027-03-01", ngayKetThuc: "2027-05-01" });
    const kyId = r.ok ? r.data.id : "";
    expect(await congBoKy(kyId)).toEqual({ ok: false, error: "Cần có ít nhất 1 nhiệm vụ trước khi công bố." });
    await themNhiemVu({ kyId, ten: "NV", diem: 10 });
    expect(await congBoKy(kyId)).toEqual({ ok: false, error: "Cần có bảng xếp loại (ít nhất 1 bậc) trước khi công bố." });
    expect((await luuBangXepLoai({ kyId, bacs: [{ ten: "A", diemToiThieu: 5 }, { ten: "a", diemToiThieu: 0 }] })).ok).toBe(false);
    expect((await luuBangXepLoai({ kyId, bacs: [{ ten: "A", diemToiThieu: 5 }, { ten: "B", diemToiThieu: 5 }] })).ok).toBe(false);
    expect((await luuBangXepLoai({ kyId, bacs: [{ ten: "A", diemToiThieu: 5 }, { ten: "B", diemToiThieu: 0 }] })).ok).toBe(true);
    expect((await congBoKy(kyId)).ok).toBe(true);
    expect(await congBoKy(kyId)).toEqual({ ok: false, error: "Kỳ đã được công bố." });
    expect(await luuBangXepLoai({ kyId, bacs: [] })).toEqual({
      ok: false,
      error: "Kỳ đã công bố phải có ít nhất 1 bậc xếp loại.",
    });
  });

  it("nhiệm vụ đã có GV đăng ký: không xóa, không sửa điểm; sửa chữ thì được", async () => {
    await dangNhapNhu("admin.quantri");
    const gv = await user("gv.nguyenvanan");
    const nv1 = await nhiemVu(1);
    await db.dangKy.create({ data: { kyId: ky1Id, gvId: gv.id, nhiemVus: { create: [{ nhiemVuId: nv1.id }] } } });

    expect(await xoaNhiemVu(nv1.id)).toEqual({ ok: false, error: "Nhiệm vụ đã có giáo viên đăng ký, không thể xóa." });
    expect((await suaNhiemVu({ id: nv1.id, ten: nv1.ten, diem: 99, thuTu: 1 })).ok).toBe(false);
    expect((await suaNhiemVu({ id: nv1.id, ten: "Biên soạn bài giảng (sửa)", moTa: "Mô tả mới", diem: nv1.diem, thuTu: 1 })).ok).toBe(true);

    // Nhiệm vụ chưa ai chọn thì xóa được.
    const nv10 = await nhiemVu(10);
    expect((await xoaNhiemVu(nv10.id)).ok).toBe(true);
  });

  it("task đã có người làm: không xóa, không đổi loại; không thêm task bắt buộc vào nhiệm vụ đã duyệt", async () => {
    await dangNhapNhu("admin.quantri");
    const gv = await user("gv.nguyenvanan");
    const nv1 = await nhiemVu(1);
    await db.dangKy.update({ where: { kyId_gvId: { kyId: ky1Id, gvId: gv.id } }, data: { trangThai: "DA_DUYET" } });
    const t = nv1.tasks[0];
    await db.gvTask.create({ data: { gvId: gv.id, kyId: ky1Id, taskId: t.id } });

    expect(await xoaTask(t.id)).toEqual({ ok: false, error: "Task đã có giáo viên làm hoặc xin làm, không thể xóa." });
    expect((await suaTask({ id: t.id, ten: t.ten, loai: "MO_RONG" })).ok).toBe(false);
    expect((await suaTask({ id: t.id, ten: "Tên mới", loai: "BAT_BUOC" })).ok).toBe(true);

    const themBB = await themTask({ nhiemVuId: nv1.id, ten: "Task mới", loai: "BAT_BUOC" });
    expect(themBB.ok).toBe(false);
    expect((await themTask({ nhiemVuId: nv1.id, ten: "Task mở rộng mới", loai: "MO_RONG" })).ok).toBe(true);

    // Task mở rộng chưa ai xin, đổi sang bắt buộc trong nhiệm vụ đã duyệt → chặn.
    const moRong = (await nhiemVu(1)).tasks.find((x) => x.loai === "MO_RONG")!;
    expect((await suaTask({ id: moRong.id, ten: moRong.ten, loai: "BAT_BUOC" })).ok).toBe(false);
  });

  it("kỳ đã chốt: khóa toàn bộ", async () => {
    await dangNhapNhu("admin.quantri");
    await db.ky.update({ where: { id: ky1Id }, data: { daChot: true } });
    const nv2 = await nhiemVu(2);
    const loi = { ok: false, error: "Kỳ đã chốt, không thể thay đổi." };
    expect(await suaNgayKy({ kyId: ky1Id, ngayBatDau: "2026-09-01", ngayKetThuc: "2026-10-01" })).toEqual(loi);
    expect(await themNhiemVu({ kyId: ky1Id, ten: "X", diem: 1 })).toEqual(loi);
    expect(await suaNhiemVu({ id: nv2.id, ten: "X", diem: nv2.diem })).toEqual(loi);
    expect(await xoaTask(nv2.tasks[0].id)).toEqual(loi);
    expect(await luuBangXepLoai({ kyId: ky1Id, bacs: [{ ten: "A", diemToiThieu: 0 }] })).toEqual(loi);
    await db.ky.update({ where: { id: ky1Id }, data: { daChot: false } });
  });
});
