import { beforeAll, describe, expect, it } from "vitest";
import { suaTaiKhoan, taoTaiKhoan, xoaTaiKhoan, datLaiMatKhau } from "@/app/(app)/admin/tai-khoan/actions";
import { dangNhapNhu, resetDb, user } from "./helpers";

beforeAll(async () => {
  await resetDb();
});

describe("Quản lý đăng nhập – chặn ở server", () => {
  it("chỉ ADMIN được gọi action", async () => {
    await dangNhapNhu("gv.nguyenvanan");
    const r = await taoTaiKhoan({ hoTen: "Hacker", role: "ADMIN" });
    expect(r).toEqual({ ok: false, error: "Bạn không có quyền thực hiện thao tác này." });
    const gv = await user("gv.tranthibinh");
    expect((await xoaTaiKhoan(gv.id)).ok).toBe(false);
    expect((await datLaiMatKhau(gv.id)).ok).toBe(false);
  });

  it("admin không tự hạ chức, không tự xóa", async () => {
    const admin = await dangNhapNhu("admin.quantri");
    expect(await suaTaiKhoan({ id: admin.id, hoTen: "Quản trị", role: "GV" })).toEqual({
      ok: false,
      error: "Bạn không thể tự hạ chức của chính mình.",
    });
    expect(await xoaTaiKhoan(admin.id)).toEqual({
      ok: false,
      error: "Bạn không thể tự xóa tài khoản của chính mình.",
    });
    // Tự đổi họ tên (giữ ADMIN) thì được.
    const r = await suaTaiKhoan({ id: admin.id, hoTen: "Quản trị viên", role: "ADMIN" });
    expect(r).toEqual({ ok: true, data: { username: "admin.quantrivien", doiTen: true } });
  });

  it("đổi gv.tranthibinh lên TBM → tbm.tranthibinh", async () => {
    await dangNhapNhu("admin.quantrivien");
    const gv = await user("gv.tranthibinh");
    const r = await suaTaiKhoan({ id: gv.id, hoTen: gv.hoTen, role: "TBM" });
    expect(r).toEqual({ ok: true, data: { username: "tbm.tranthibinh", doiTen: true } });
  });

  it("họ tên không có chữ → báo lỗi", async () => {
    await dangNhapNhu("admin.quantrivien");
    expect(await taoTaiKhoan({ hoTen: "!!!", role: "GV" })).toEqual({
      ok: false,
      error: "Họ tên phải có ít nhất một chữ cái hoặc chữ số.",
    });
    expect((await taoTaiKhoan({ hoTen: "Ai đó", role: "SUPERADMIN" })).ok).toBe(false);
  });
});
