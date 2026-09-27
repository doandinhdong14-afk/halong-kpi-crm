import { beforeAll, describe, expect, it } from "vitest";
import {
  datLaiMatKhau,
  suaTaiKhoan,
  taoTaiKhoan,
  xemTruocTaiKhoan,
  xoaTaiKhoan,
} from "@/app/(app)/admin/tai-khoan/actions";
import { canhBaoThieuNguoi, lyDoKhongGuiDangKy, nguoiChot, nguoiDuyet } from "@/lib/co-cau";
import { db } from "@/lib/db";
import { taiCoCau } from "@/lib/services/co-cau";
import { dangNhapNhu, resetDb, user } from "./helpers";

beforeAll(async () => {
  await resetDb();
});

describe("Quản lý đăng nhập – chặn ở server", () => {
  it("chỉ ADMIN được gọi action", async () => {
    await dangNhapNhu("gv.nguyenvanan");
    const loi = { ok: false, error: "Bạn không có quyền thực hiện thao tác này." };
    expect(await taoTaiKhoan({ hoTen: "Hacker", role: "ADMIN" })).toEqual(loi);
    const gv = await user("gv.tranthibinh");
    expect(await xoaTaiKhoan(gv.id)).toEqual(loi);
    expect(await datLaiMatKhau(gv.id)).toEqual(loi);
    expect(await suaTaiKhoan({ id: gv.id, hoTen: gv.hoTen, role: "ADMIN" })).toEqual(loi);
    await dangNhapNhu("ht.nguyenvanhieu");
    expect(await xemTruocTaiKhoan({ hoTen: "Ai đó", role: "GV" })).toEqual(loi);
  });

  it("admin không tự hạ chức, không tự xóa; tự đổi họ tên thì được", async () => {
    const admin = await dangNhapNhu("admin.quantri");
    expect(await suaTaiKhoan({ id: admin.id, hoTen: "Quản trị", role: "GV" })).toEqual({
      ok: false,
      error: "Bạn không thể tự hạ chức của chính mình.",
    });
    expect(await xoaTaiKhoan(admin.id)).toEqual({ ok: false, error: "Bạn không thể tự xóa tài khoản của chính mình." });
    expect(await suaTaiKhoan({ id: admin.id, hoTen: "Quản trị viên", role: "ADMIN" })).toEqual({
      ok: true,
      data: { username: "admin.quantrivien", doiTen: true },
    });
    expect(await suaTaiKhoan({ id: admin.id, hoTen: "Quản trị", role: "ADMIN" })).toMatchObject({
      ok: true,
      data: { username: "admin.quantri" },
    });
  });

  it("họ tên không có chữ / chức vụ lạ → báo lỗi", async () => {
    await dangNhapNhu("admin.quantri");
    expect(await taoTaiKhoan({ hoTen: "!!!", role: "GV" })).toEqual({
      ok: false,
      error: "Họ tên phải có ít nhất một chữ cái hoặc chữ số.",
    });
    expect((await taoTaiKhoan({ hoTen: "Ai đó", role: "SUPERADMIN" })).ok).toBe(false);
  });

  it("tạo tài khoản: gán đơn vị tự động, mật khẩu 123456, xem trước tên", async () => {
    await dangNhapNhu("admin.quantri");
    expect(await xemTruocTaiKhoan({ hoTen: "Nguyễn Văn An", role: "GV" })).toEqual({
      ok: true,
      data: { username: "gv.nguyenvanan2", soKyCoKpi: 0 },
    });
    // Case phụ: tạo GV trùng tên → tên đăng nhập có số 2.
    expect(await taoTaiKhoan({ hoTen: "Nguyễn Văn An", role: "GV" })).toEqual({
      ok: true,
      data: { username: "gv.nguyenvanan2" },
    });
    const gv2 = await db.user.findUniqueOrThrow({ where: { username: "gv.nguyenvanan2" }, include: { boMon: true } });
    expect(gv2.boMon?.ten).toBe("Bộ môn Khoa học máy tính");
    expect(gv2.khoaId).toBeNull();
    expect(gv2.isDefaultPassword).toBe(true);
    await xoaTaiKhoan(gv2.id);
  });
});

describe("giới hạn cơ cấu (mục 2.4)", () => {
  it("bộ môn đã có TBM → chặn; hạ TBM xuống GV trước → lên được (case phụ mục 15)", async () => {
    await dangNhapNhu("admin.quantri");
    const binh = await user("gv.tranthibinh");
    const r = await suaTaiKhoan({ id: binh.id, hoTen: binh.hoTen, role: "TBM" });
    expect(r).toEqual({
      ok: false,
      error: "Bộ môn này đã có trưởng bộ môn (tbm.phamthibich). Hãy đổi chức vụ người đó trước.",
    });
    expect((await taoTaiKhoan({ hoTen: "Người Mới", role: "TBM" })).ok).toBe(false);

    const bich = await user("tbm.phamthibich");
    expect(await suaTaiKhoan({ id: bich.id, hoTen: bich.hoTen, role: "GV" })).toEqual({
      ok: true,
      data: { username: "gv.phamthibich", doiTen: true },
    });
    expect(await suaTaiKhoan({ id: binh.id, hoTen: binh.hoTen, role: "TBM" })).toEqual({
      ok: true,
      data: { username: "tbm.tranthibinh", doiTen: true },
    });
    const cc = await taiCoCau();
    const an = cc.users.find((x) => x.username === "gv.nguyenvanan")!;
    expect(nguoiDuyet(an, cc)?.username).toBe("tbm.tranthibinh");

    // Trả lại như seed cho các test sau.
    await suaTaiKhoan({ id: binh.id, hoTen: binh.hoTen, role: "GV" });
    await suaTaiKhoan({ id: bich.id, hoTen: bich.hoTen, role: "TBM" });
    expect((await user("tbm.phamthibich")).boMonId).not.toBeNull();
  });

  it("khoa đã có TK, trường đã có HT → chặn", async () => {
    await dangNhapNhu("admin.quantri");
    expect(await taoTaiKhoan({ hoTen: "Trưởng Khoa Hai", role: "TK" })).toEqual({
      ok: false,
      error: "Khoa này đã có trưởng khoa (tk.levankhoa). Hãy đổi chức vụ người đó trước.",
    });
    const an = await user("gv.nguyenvanan");
    expect(await suaTaiKhoan({ id: an.id, hoTen: an.hoTen, role: "HT" })).toEqual({
      ok: false,
      error: "Trường đã có hiệu trưởng (ht.nguyenvanhieu). Hãy đổi chức vụ người đó trước.",
    });
  });

  it("khoa đã có hiệu phó → không gán được cho hiệu phó khác", async () => {
    await dangNhapNhu("admin.quantri");
    const khoa = await db.khoa.findFirstOrThrow();
    expect(await taoTaiKhoan({ hoTen: "Hiệu Phó Hai", role: "HP", khoaPhuTrachIds: [khoa.id] })).toEqual({
      ok: false,
      error: "Khoa Công nghệ thông tin đã có hiệu phó phụ trách.",
    });
    // Không chọn khoa nào thì tạo được (nhiều hiệu phó được phép).
    expect(await taoTaiKhoan({ hoTen: "Hiệu Phó Hai", role: "HP" })).toEqual({ ok: true, data: { username: "hp.hieuphohai" } });
    await xoaTaiKhoan((await user("hp.hieuphohai")).id);
  });
});

describe("xóa / tạo lại hiệu phó (case phụ mục 15)", () => {
  it("xóa hiệu phó → khoa chưa có hiệu phó, TBM và TK bị chặn gửi, admin thấy cảnh báo; tạo HP mới gán khoa → chạy lại", async () => {
    await dangNhapNhu("admin.quantri");
    const hp = await user("hp.tranthiphuong");
    expect(await xoaTaiKhoan(hp.id)).toEqual({ ok: true, data: undefined });
    const khoa = await db.khoa.findFirstOrThrow();
    expect(khoa.hieuPhoId).toBeNull();

    let cc = await taiCoCau();
    const tbm = cc.users.find((x) => x.username === "tbm.phamthibich")!;
    const tk = cc.users.find((x) => x.username === "tk.levankhoa")!;
    expect(lyDoKhongGuiDangKy(tbm, cc)).toBe("Chưa có hiệu phó phụ trách, vui lòng liên hệ admin.");
    expect(lyDoKhongGuiDangKy(tk, cc)).toBe("Chưa có hiệu phó phụ trách, vui lòng liên hệ admin.");
    expect(canhBaoThieuNguoi(cc).join(" ")).toMatch(/chưa có hiệu phó phụ trách/);

    expect(await taoTaiKhoan({ hoTen: "Trần Thị Phương", role: "HP", khoaPhuTrachIds: [khoa.id] })).toEqual({
      ok: true,
      data: { username: "hp.tranthiphuong" },
    });
    cc = await taiCoCau();
    expect(nguoiChot(tbm, cc)?.username).toBe("hp.tranthiphuong");
    expect(nguoiDuyet(tk, cc)?.username).toBe("hp.tranthiphuong");
    expect(canhBaoThieuNguoi(cc)).toEqual([]);
  });

  it("hiệu phó đổi sang chức khác → khoa thành chưa có hiệu phó; đổi lại + chọn khoa → phụ trách lại", async () => {
    await dangNhapNhu("admin.quantri");
    const hp = await user("hp.tranthiphuong");
    const khoa = await db.khoa.findFirstOrThrow();
    expect((await suaTaiKhoan({ id: hp.id, hoTen: hp.hoTen, role: "GV" })).ok).toBe(true);
    expect((await db.khoa.findFirstOrThrow()).hieuPhoId).toBeNull();
    expect(
      await suaTaiKhoan({ id: hp.id, hoTen: hp.hoTen, role: "HP", khoaPhuTrachIds: [khoa.id] }),
    ).toMatchObject({ ok: true, data: { username: "hp.tranthiphuong" } });
    const sau = await db.user.findUniqueOrThrow({ where: { id: hp.id } });
    expect(sau.boMonId).toBeNull();
    expect((await db.khoa.findFirstOrThrow()).hieuPhoId).toBe(hp.id);
  });
});

describe("đổi chức vụ khi đang có KPI ở kỳ chưa chốt (A2)", () => {
  it("phải xác nhận; xác nhận thì xóa dữ liệu KPI kỳ chưa chốt", async () => {
    await dangNhapNhu("admin.quantri");
    const an = await user("gv.nguyenvanan");
    const ky = await db.ky.findFirstOrThrow();
    const nv = await db.nhiemVu.findFirstOrThrow({ where: { kyId: ky.id, doiTuong: "GV" } });
    await db.dangKy.create({ data: { kyId: ky.id, userId: an.id, nhiemVus: { create: [{ nhiemVuId: nv.id }] } } });

    expect(await xemTruocTaiKhoan({ hoTen: an.hoTen, role: "TK", userId: an.id })).toMatchObject({
      ok: true,
      data: { soKyCoKpi: 1 },
    });
    // Đổi họ tên (giữ chức vụ) không cần xác nhận.
    expect(await xemTruocTaiKhoan({ hoTen: an.hoTen, role: "GV", userId: an.id })).toMatchObject({ data: { soKyCoKpi: 0 } });

    const tk = await user("tk.levankhoa");
    await suaTaiKhoan({ id: tk.id, hoTen: tk.hoTen, role: "GV" });
    const r = await suaTaiKhoan({ id: an.id, hoTen: an.hoTen, role: "TK" });
    expect(r).toEqual({
      ok: false,
      error: "Tài khoản đang có dữ liệu KPI ở 1 kỳ chưa chốt. Đổi chức vụ sẽ xóa dữ liệu này, vui lòng xác nhận.",
    });
    expect(await db.dangKy.count({ where: { userId: an.id } })).toBe(1);

    expect(await suaTaiKhoan({ id: an.id, hoTen: an.hoTen, role: "TK", xacNhanXoaKpi: true })).toMatchObject({
      ok: true,
      data: { username: "tk.nguyenvanan" },
    });
    expect(await db.dangKy.count({ where: { userId: an.id } })).toBe(0);
    const sau = await db.user.findUniqueOrThrow({ where: { id: an.id } });
    expect(sau.khoaId).not.toBeNull();
    expect(sau.boMonId).toBeNull();
  });
});
