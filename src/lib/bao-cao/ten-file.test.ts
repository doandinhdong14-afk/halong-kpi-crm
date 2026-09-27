import { describe, expect, it } from "vitest";
import { khongDauLienNhau, tenFileBaoCao } from "./ten-file";

describe("tên file báo cáo (mục 6.3)", () => {
  it("bỏ dấu, viết liền, hoa chữ đầu", () => {
    expect(khongDauLienNhau("Bộ môn Khoa học máy tính")).toBe("BoMonKhoaHocMayTinh");
    expect(khongDauLienNhau("Khoa Công nghệ thông tin")).toBe("KhoaCongNgheThongTin");
    expect(khongDauLienNhau("Đào tạo – Đảm bảo chất lượng")).toBe("DaoTaoDamBaoChatLuong");
    expect(khongDauLienNhau("ToanTruong")).toBe("ToanTruong");
  });

  it("thêm _TamTinh khi kỳ chưa chốt", () => {
    const p = { donVi: "Bộ môn Khoa học máy tính", soKy: 1, namHoc: "2026-2027", ngay: "2026-09-27", duoi: "xlsx" as const };
    expect(tenFileBaoCao({ ...p, tamTinh: true })).toBe("BaoCao_BoMonKhoaHocMayTinh_Ky1-2026-2027_20260927_TamTinh.xlsx");
    expect(tenFileBaoCao({ ...p, tamTinh: false, duoi: "pdf" })).toBe("BaoCao_BoMonKhoaHocMayTinh_Ky1-2026-2027_20260927.pdf");
  });
});
