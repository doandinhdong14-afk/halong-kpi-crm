import { describe, expect, it } from "vitest";
import { hienPhanTram, thongKeTienDo, type TaskTienDo } from "./tien-do";

const bb = (trangThai: TaskTienDo["trangThai"]): TaskTienDo => ({ loai: "BAT_BUOC", trangThai });
const mr = (trangThai: TaskTienDo["trangThai"]): TaskTienDo => ({ loai: "MO_RONG", trangThai });

describe("tiến độ task", () => {
  it("chỉ tính task bắt buộc vào %, task mở rộng đã duyệt là vượt", () => {
    const tk = thongKeTienDo([bb("DA_DUYET"), bb("CHO_DUYET"), bb("TU_CHOI"), bb("CHUA_LAM"), mr("DA_DUYET"), mr("CHO_DUYET")]);
    expect(tk).toEqual({ tongBatBuoc: 4, daDuyet: 1, choDuyet: 1, tuChoi: 1, chuaLam: 1, phanTram: 25, soVuot: 1 });
  });

  it("biểu đồ không quá 100% dù có task vượt", () => {
    const tk = thongKeTienDo([bb("DA_DUYET"), mr("DA_DUYET"), mr("DA_DUYET")]);
    expect(tk.phanTram).toBe(100);
    expect(tk.soVuot).toBe(2);
  });

  it("không có task bắt buộc → 100%", () => {
    expect(thongKeTienDo([]).phanTram).toBe(100);
  });

  it("làm tròn 2 chữ số, hiển thị kiểu Việt", () => {
    const tk = thongKeTienDo([bb("DA_DUYET"), bb("CHUA_LAM"), bb("CHUA_LAM")]);
    expect(tk.phanTram).toBe(33.33);
    expect(hienPhanTram(tk.phanTram)).toBe("33,3%");
    expect(hienPhanTram(100)).toBe("100%");
  });
});
