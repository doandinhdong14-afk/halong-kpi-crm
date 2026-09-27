import { describe, expect, it } from "vitest";
import { bacThapNhat, tinhXepLoai } from "./xep-loai";

const BANG = [
  { ten: "A1", diemToiThieu: 80 },
  { ten: "A2", diemToiThieu: 65 },
  { ten: "B", diemToiThieu: 50 },
  { ten: "C", diemToiThieu: 35 },
  { ten: "D", diemToiThieu: 20 },
  { ten: "F", diemToiThieu: 0 },
];

describe("xếp loại đăng ký (mục 9.2)", () => {
  it("kịch bản mục 14", () => {
    expect(tinhXepLoai(100, BANG)).toBe("A1"); // gv.nguyenvanan chọn cả 10
    expect(tinhXepLoai(39, BANG)).toBe("C"); // nhiệm vụ 1,2,3
    expect(tinhXepLoai(59, BANG)).toBe("B"); // nhiệm vụ 1–5
  });

  it("đúng ngưỡng thì đạt bậc đó", () => {
    expect(tinhXepLoai(80, BANG)).toBe("A1");
    expect(tinhXepLoai(79, BANG)).toBe("A2");
    expect(tinhXepLoai(0, BANG)).toBe("F");
  });

  it("không đủ bậc nào → bậc thấp nhất; bảng rỗng → null; không phụ thuộc thứ tự", () => {
    const bang = [{ ten: "Tốt", diemToiThieu: 50 }, { ten: "Khá", diemToiThieu: 30 }];
    expect(tinhXepLoai(10, bang)).toBe("Khá");
    expect(tinhXepLoai(10, [])).toBeNull();
    expect(tinhXepLoai(70, [...BANG].reverse())).toBe("A2");
    expect(bacThapNhat(BANG)).toBe("F");
  });
});
