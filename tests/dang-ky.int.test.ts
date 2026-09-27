import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { chonNhiemVu, guiDangKy } from "@/app/(app)/dau-ky/actions";
import { duyetDangKy, tuChoiDangKy } from "@/app/(app)/duyet/actions";
import type { DoiTuong } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { chuoiThanhNgay, congNgay, homNayVN } from "@/lib/time";
import { dangNhapNhu, resetDb, user } from "./helpers";

let kyId: string;

async function nhiemVuCua(doiTuong: DoiTuong) {
  return db.nhiemVu.findMany({ where: { kyId, doiTuong }, orderBy: { thuTu: "asc" }, include: { tasks: true } });
}

/** Người làm KPI tick các nhiệm vụ thứ tự 1..n của vị trí mình rồi gửi. */
async function dangKyVaGui(username: string, doiTuong: DoiTuong, n: number) {
  await dangNhapNhu(username);
  const nvs = await nhiemVuCua(doiTuong);
  for (const nv of nvs.slice(0, n)) {
    expect(await chonNhiemVu({ kyId, nhiemVuId: nv.id, chon: true })).toEqual({ ok: true, data: undefined });
  }
  return guiDangKy(kyId);
}

async function dangKyCua(username: string) {
  const u = await user(username);
  return db.dangKy.findUniqueOrThrow({ where: { kyId_userId: { kyId, userId: u.id } } });
}

async function datNgay(batDau: string, ketThuc: string) {
  await db.ky.update({ where: { id: kyId }, data: { ngayBatDau: chuoiThanhNgay(batDau), ngayKetThuc: chuoiThanhNgay(ketThuc) } });
}

beforeAll(async () => {
  await resetDb();
  kyId = (await db.ky.findFirstOrThrow()).id;
});

beforeEach(async () => {
  // Mỗi test bắt đầu với kỳ mở: bắt đầu hôm nay, kết thúc +30 ngày.
  await datNgay(homNayVN(), congNgay(homNayVN(), 30));
});

describe("cả 4 vị trí đăng ký và được đúng người duyệt (mục 3.2, 5.1)", () => {
  const BANG: [string, DoiTuong, number, string, number, string, string][] = [
    // người làm, vị trí, số nhiệm vụ, người duyệt, tổng điểm, xếp loại, người KHÔNG được duyệt
    ["gv.nguyenvanan", "GV", 3, "tbm.phamthibich", 39, "C", "tk.levankhoa"],
    ["tbm.phamthibich", "TBM", 3, "tk.levankhoa", 55, "B", "hp.tranthiphuong"],
    ["tk.levankhoa", "TK", 4, "hp.tranthiphuong", 80, "A1", "ht.nguyenvanhieu"],
    ["hp.tranthiphuong", "HP", 3, "ht.nguyenvanhieu", 60, "B", "tbm.phamthibich"],
  ];

  for (const [lam, doiTuong, n, duyet, tongDiem, xepLoai, khongDuoc] of BANG) {
    it(`${lam} → ${duyet} duyệt`, async () => {
      expect(await dangKyVaGui(lam, doiTuong, n)).toEqual({ ok: true, data: { tongDiem, xepLoai } });
      const dk = await dangKyCua(lam);
      expect(dk.trangThai).toBe("CHO_DUYET");

      // Người duyệt nhận thông báo, link tới trang chi tiết.
      const nguoiDuyet = await user(duyet);
      const tb = await db.thongBao.findFirstOrThrow({ where: { userId: nguoiDuyet.id }, orderBy: { taoLuc: "desc" } });
      expect(tb.noiDung).toMatch(/đã gửi danh sách đăng ký nhiệm vụ/);
      expect(tb.link).toBe(`/duyet/${dk.userId}?kyId=${kyId}&tab=dang-ky`);

      // Không phải người duyệt (kể cả người chốt) → không thấy.
      await dangNhapNhu(khongDuoc);
      expect(await duyetDangKy({ dangKyId: dk.id })).toMatchObject({ ok: false });
      expect((await dangKyCua(lam)).trangThai).toBe("CHO_DUYET");

      await dangNhapNhu(duyet);
      const r = await duyetDangKy({ dangKyId: dk.id, nhanXet: "Tốt" });
      expect(r.ok).toBe(true);
      const sau = await dangKyCua(lam);
      expect(sau).toMatchObject({ trangThai: "DA_DUYET", tongDiem, xepLoai, nhanXet: "Tốt", nguoiDuyetId: nguoiDuyet.id });

      // Tạo đúng các task bắt buộc của nhiệm vụ đã chọn, trạng thái Chưa làm.
      const nvs = (await nhiemVuCua(doiTuong)).slice(0, n);
      const soBatBuoc = nvs.flatMap((nv) => nv.tasks.filter((t) => t.loai === "BAT_BUOC")).length;
      const tasks = await db.kpiTask.findMany({ where: { userId: dk.userId, kyId } });
      expect(tasks).toHaveLength(soBatBuoc);
      expect(tasks.every((t) => t.trangThai === "CHUA_LAM")).toBe(true);
      expect(r.ok && r.data.soTask).toBe(soBatBuoc);

      const tbLam = await db.thongBao.findFirstOrThrow({ where: { userId: dk.userId }, orderBy: { taoLuc: "desc" } });
      expect(tbLam.noiDung).toMatch(/đã được duyệt/);
    });
  }

  it("đã duyệt thì không đổi nhiệm vụ được nữa", async () => {
    await dangNhapNhu("gv.nguyenvanan");
    const nv = (await nhiemVuCua("GV"))[5];
    expect(await chonNhiemVu({ kyId, nhiemVuId: nv.id, chon: true })).toEqual({
      ok: false,
      error: "Danh sách đã được duyệt, không thể thay đổi nhiệm vụ.",
    });
  });
});

describe("luật đăng ký", () => {
  it("chỉ tick được nhiệm vụ của vị trí mình; phải chọn ≥1 nhiệm vụ", async () => {
    await dangNhapNhu("gv.tranthibinh");
    const nvTbm = (await nhiemVuCua("TBM"))[0];
    expect(await chonNhiemVu({ kyId, nhiemVuId: nvTbm.id, chon: true })).toEqual({
      ok: false,
      error: "Nhiệm vụ không thuộc kỳ này hoặc không dành cho vị trí của bạn.",
    });
    expect(await guiDangKy(kyId)).toEqual({ ok: false, error: "Phải chọn ít nhất 1 nhiệm vụ mới gửi được." });
  });

  it("HT, Admin không làm KPI → bị chặn", async () => {
    const nv = (await nhiemVuCua("GV"))[0];
    for (const u of ["ht.nguyenvanhieu", "admin.quantri"]) {
      await dangNhapNhu(u);
      expect(await chonNhiemVu({ kyId, nhiemVuId: nv.id, chon: true })).toEqual({
        ok: false,
        error: "Bạn không có quyền thực hiện thao tác này.",
      });
    }
  });

  it("case phụ: ngày bắt đầu = hôm qua → người chưa gửi không gửi được nữa", async () => {
    await dangNhapNhu("gv.tranthibinh");
    const nv = (await nhiemVuCua("GV"))[0];
    expect((await chonNhiemVu({ kyId, nhiemVuId: nv.id, chon: true })).ok).toBe(true);
    await datNgay(congNgay(homNayVN(), -1), congNgay(homNayVN(), 30));
    expect(await guiDangKy(kyId)).toEqual({ ok: false, error: "Đã hết hạn đăng ký (23:59 ngày bắt đầu kỳ)." });
    expect(await chonNhiemVu({ kyId, nhiemVuId: nv.id, chon: false })).toMatchObject({ ok: false });
  });

  it("case phụ: bị từ chối sau ngày bắt đầu → vẫn sửa và gửi lại được (trước deadline); từ chối bắt buộc nhận xét", async () => {
    expect((await dangKyVaGui("gv.levancuong", "GV", 2)).ok).toBe(true);
    const dk = await dangKyCua("gv.levancuong");
    await dangNhapNhu("tbm.phamthibich");
    expect(await tuChoiDangKy({ dangKyId: dk.id, nhanXet: "  " })).toEqual({ ok: false, error: "Vui lòng nhập nhận xét." });
    expect((await tuChoiDangKy({ dangKyId: dk.id, nhanXet: "Chọn thêm nhiệm vụ" })).ok).toBe(true);
    expect((await dangKyCua("gv.levancuong")).trangThai).toBe("TU_CHOI");

    await datNgay(congNgay(homNayVN(), -5), congNgay(homNayVN(), 30));
    await dangNhapNhu("gv.levancuong");
    const nvs = await nhiemVuCua("GV");
    expect((await chonNhiemVu({ kyId, nhiemVuId: nvs[2].id, chon: true })).ok).toBe(true);
    // Trong lúc sửa vẫn là Bị từ chối (B6).
    expect((await dangKyCua("gv.levancuong")).trangThai).toBe("TU_CHOI");
    expect(await guiDangKy(kyId)).toEqual({ ok: true, data: { tongDiem: 39, xepLoai: "C" } });
    const sau = await dangKyCua("gv.levancuong");
    expect(sau.trangThai).toBe("CHO_DUYET");
    expect(sau.nhanXet).toBeNull();

    // Hết deadline → người duyệt không duyệt được nữa.
    await datNgay(congNgay(homNayVN(), -30), congNgay(homNayVN(), -1));
    await dangNhapNhu("tbm.phamthibich");
    expect(await duyetDangKy({ dangKyId: sau.id })).toEqual({
      ok: false,
      error: "Đã hết deadline của kỳ, mọi thao tác đã bị khóa.",
    });
  });

  it("kỳ đã chốt → chặn", async () => {
    const dk = await dangKyCua("gv.levancuong");
    await db.ky.update({ where: { id: kyId }, data: { daChot: true } });
    await dangNhapNhu("tbm.phamthibich");
    expect(await duyetDangKy({ dangKyId: dk.id })).toEqual({ ok: false, error: "Kỳ đã chốt, không thể thao tác." });
    await db.ky.update({ where: { id: kyId }, data: { daChot: false } });
  });
});

describe("A3: thiếu người duyệt / người chốt → chặn gửi", () => {
  it("khoa chưa có hiệu phó → TBM (thiếu người chốt) và TK (thiếu người duyệt) bị chặn; GV vẫn gửi được", async () => {
    const khoa = await db.khoa.findFirstOrThrow();
    await db.khoa.update({ where: { id: khoa.id }, data: { hieuPhoId: null } });
    // Reset đăng ký của TBM, TK để thử gửi lại từ đầu.
    await db.dangKy.deleteMany({ where: { user: { username: { in: ["tbm.phamthibich", "tk.levankhoa"] } } } });
    await db.kpiTask.deleteMany({ where: { user: { username: { in: ["tbm.phamthibich", "tk.levankhoa"] } } } });

    const loi = { ok: false, error: "Chưa có hiệu phó phụ trách, vui lòng liên hệ admin." };
    expect(await dangKyVaGui("tbm.phamthibich", "TBM", 1)).toEqual(loi);
    expect(await dangKyVaGui("tk.levankhoa", "TK", 1)).toEqual(loi);
    expect((await dangKyCua("tbm.phamthibich")).trangThai).toBe("NHAP");

    await db.khoa.update({ where: { id: khoa.id }, data: { hieuPhoId: (await user("hp.tranthiphuong")).id } });
    await dangNhapNhu("tbm.phamthibich");
    expect((await guiDangKy(kyId)).ok).toBe(true);
  });
});
