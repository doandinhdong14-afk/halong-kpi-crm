import { describe, expect, it } from "vitest";
import { boDau, chonTenTrong, tenGoc } from "./username";

describe("tên đăng nhập (mục 2.2)", () => {
  it("bỏ dấu, đ → d, viết liền, bỏ ký tự đặc biệt", () => {
    expect(boDau("Nguyễn Văn Nam")).toBe("nguyenvannam");
    expect(boDau("Đỗ Thị Đào")).toBe("dothidao");
    expect(boDau("  Lê-Văn  O'Cường ")).toBe("levanocuong");
  });

  it("tiền tố theo chức vụ", () => {
    expect(tenGoc("Nguyễn Văn Nam", "GV")).toBe("gv.nguyenvannam");
    expect(tenGoc("Nguyễn Văn Nam", "TBM")).toBe("tbm.nguyenvannam");
    expect(tenGoc("Quản trị", "ADMIN")).toBe("admin.quantri");
    expect(tenGoc("!!!", "GV")).toBeNull();
  });

  it("trùng thì thêm số từ 2, lấy số trống nhỏ nhất", () => {
    expect(chonTenTrong("gv.a", new Set())).toBe("gv.a");
    expect(chonTenTrong("gv.a", new Set(["gv.a"]))).toBe("gv.a2");
    expect(chonTenTrong("gv.a", new Set(["gv.a", "gv.a2"]))).toBe("gv.a3");
    expect(chonTenTrong("gv.a", new Set(["gv.a", "gv.a3"]))).toBe("gv.a2");
  });
});
