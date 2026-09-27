import { describe, expect, it } from "vitest";
import { lyDoKhongDuyetDangKy, lyDoKhongSuaDangKy, lyDoKhongThaoTacTask } from "./rules";
import { chuoiThanhNgay } from "./time";

const ky = {
  ngayBatDau: chuoiThanhNgay("2026-09-27"),
  ngayKetThuc: chuoiThanhNgay("2026-10-27"),
  daCongBo: true,
  daChot: false,
};
const truocHan = new Date("2026-09-27T16:59:59Z"); // 23:59:59 ngày bắt đầu (VN)
const sauHan = new Date("2026-09-27T17:00:00Z"); // 00:00 ngày hôm sau (VN)
const cuoiDeadline = new Date("2026-10-27T16:59:59Z");
const sauDeadline = new Date("2026-10-27T17:00:00Z");

describe("luật thời gian (bảng 10.1)", () => {
  it("Nháp: gửi được đến hết hạn đăng ký", () => {
    expect(lyDoKhongSuaDangKy(ky, null, truocHan)).toBeNull();
    expect(lyDoKhongSuaDangKy(ky, "NHAP", truocHan)).toBeNull();
    expect(lyDoKhongSuaDangKy(ky, "NHAP", sauHan)).toMatch(/hết hạn đăng ký/);
  });

  it("Bị từ chối: sửa + gửi lại đến hết deadline (kể cả sau hạn đăng ký)", () => {
    expect(lyDoKhongSuaDangKy(ky, "TU_CHOI", sauHan)).toBeNull();
    expect(lyDoKhongSuaDangKy(ky, "TU_CHOI", cuoiDeadline)).toBeNull();
    expect(lyDoKhongSuaDangKy(ky, "TU_CHOI", sauDeadline)).toMatch(/deadline/);
  });

  it("Chờ duyệt / Đã duyệt: người làm KPI chỉ xem", () => {
    expect(lyDoKhongSuaDangKy(ky, "CHO_DUYET", truocHan)).toMatch(/chờ/);
    expect(lyDoKhongSuaDangKy(ky, "DA_DUYET", truocHan)).toMatch(/đã được duyệt/);
  });

  it("người duyệt duyệt đăng ký, mọi thao tác task: đến hết deadline", () => {
    expect(lyDoKhongDuyetDangKy(ky, cuoiDeadline)).toBeNull();
    expect(lyDoKhongDuyetDangKy(ky, sauDeadline)).toMatch(/deadline/);
    expect(lyDoKhongThaoTacTask(ky, cuoiDeadline)).toBeNull();
    expect(lyDoKhongThaoTacTask(ky, sauDeadline)).toMatch(/deadline/);
  });

  it("B5: kỳ đã chốt hoặc chưa công bố → chặn mọi thao tác", () => {
    const chot = { ...ky, daChot: true };
    const chuaCongBo = { ...ky, daCongBo: false };
    for (const k of [chot, chuaCongBo]) {
      expect(lyDoKhongSuaDangKy(k, "NHAP", truocHan)).not.toBeNull();
      expect(lyDoKhongDuyetDangKy(k, truocHan)).not.toBeNull();
      expect(lyDoKhongThaoTacTask(k, truocHan)).not.toBeNull();
    }
  });
});
