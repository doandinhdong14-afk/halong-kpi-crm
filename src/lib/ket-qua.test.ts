import { describe, expect, it } from "vitest";
import { GHI_CHU_CHUA_DUYET, tinhKetQuaGv, type TaskKetQua } from "./ket-qua";

const bb = (ten: string, trangThai: TaskKetQua["trangThai"]): TaskKetQua => ({ ten, nhiemVu: "NV", loai: "BAT_BUOC", trangThai });
const mr = (ten: string, trangThai: TaskKetQua["trangThai"]): TaskKetQua => ({ ten, nhiemVu: "NV", loai: "MO_RONG", trangThai });
const duyet = (xepLoai: string) => ({ trangThai: "DA_DUYET" as const, xepLoai });

describe("chốt kỳ – kết quả GV (mục 9.3 + kịch bản mục 14)", () => {
  it("~50% task bắt buộc → Không đạt, giữ xếp loại đăng ký A1, liệt kê task thiếu", () => {
    const kq = tinhKetQuaGv({
      dangKy: duyet("A1"),
      tasks: [bb("t1", "DA_DUYET"), bb("t2", "DA_DUYET"), bb("t3", "CHO_DUYET"), bb("t4", "CHUA_LAM")],
      bacThapNhat: "F",
    });
    expect(kq).toEqual({
      ketQua: "KHONG_DAT",
      xepLoai: "A1",
      phanTram: 50,
      taskThieu: [{ ten: "t3", nhiemVu: "NV" }, { ten: "t4", nhiemVu: "NV" }],
      taskVuot: [],
      ghiChu: null,
    });
  });

  it("100% bắt buộc, không vượt → Đạt – C", () => {
    const kq = tinhKetQuaGv({ dangKy: duyet("C"), tasks: [bb("t1", "DA_DUYET"), mr("m1", "CHUA_LAM")], bacThapNhat: "F" });
    expect(kq).toMatchObject({ ketQua: "DAT", xepLoai: "C", phanTram: 100, taskThieu: [], taskVuot: [] });
  });

  it("100% + có task mở rộng đã duyệt → Vượt chỉ tiêu – B + list task vượt", () => {
    const kq = tinhKetQuaGv({
      dangKy: duyet("B"),
      tasks: [bb("t1", "DA_DUYET"), mr("m1", "DA_DUYET"), mr("m2", "DA_DUYET"), mr("m3", "CHO_DUYET")],
      bacThapNhat: "F",
    });
    expect(kq).toMatchObject({ ketQua: "VUOT", xepLoai: "B", taskVuot: [{ ten: "m1" }, { ten: "m2" }] });
  });

  it("không đăng ký / chưa được duyệt → Không đạt – F, 0%, ghi chú", () => {
    for (const dangKy of [null, { trangThai: "CHO_DUYET" as const, xepLoai: "A1" }, { trangThai: "NHAP" as const, xepLoai: null }]) {
      expect(tinhKetQuaGv({ dangKy, tasks: [], bacThapNhat: "F" })).toEqual({
        ketQua: "KHONG_DAT",
        xepLoai: "F",
        phanTram: 0,
        taskThieu: [],
        taskVuot: [],
        ghiChu: GHI_CHU_CHUA_DUYET,
      });
    }
  });

  it("task Chờ duyệt khi chốt → tính là chưa xong", () => {
    const kq = tinhKetQuaGv({ dangKy: duyet("A2"), tasks: [bb("t1", "CHO_DUYET")], bacThapNhat: "F" });
    expect(kq).toMatchObject({ ketQua: "KHONG_DAT", phanTram: 0, taskThieu: [{ ten: "t1" }] });
  });

  it("không đạt thì vẫn ghi task vượt nhưng kết quả là Không đạt", () => {
    const kq = tinhKetQuaGv({ dangKy: duyet("B"), tasks: [bb("t1", "CHUA_LAM"), mr("m1", "DA_DUYET")], bacThapNhat: "F" });
    expect(kq.ketQua).toBe("KHONG_DAT");
    expect(kq.taskVuot).toHaveLength(1);
  });
});
