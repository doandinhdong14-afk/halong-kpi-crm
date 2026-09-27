import { describe, expect, it } from "vitest";
import { chuoiThanhNgay, congNgay, deadline, hanDangKy, hienNgay, homNayVN, soNgayConLai } from "./time";

describe("time (giờ Việt Nam)", () => {
  it("hôm nay theo giờ VN, không theo UTC", () => {
    // 17:30 UTC ngày 27 = 00:30 ngày 28 giờ VN
    expect(homNayVN(new Date("2026-09-27T17:30:00Z"))).toBe("2026-09-28");
    expect(homNayVN(new Date("2026-09-27T16:59:59Z"))).toBe("2026-09-27");
  });

  it("hạn đăng ký = 23:59:59 ngày bắt đầu, deadline = 23:59:59 ngày kết thúc (giờ VN)", () => {
    const ky = { ngayBatDau: chuoiThanhNgay("2026-09-27"), ngayKetThuc: chuoiThanhNgay("2026-10-27") };
    expect(hanDangKy(ky).toISOString()).toBe("2026-09-27T16:59:59.999Z");
    expect(deadline(ky).toISOString()).toBe("2026-10-27T16:59:59.999Z");
  });

  it("cộng ngày, hiển thị ngày", () => {
    expect(congNgay("2026-09-27", 30)).toBe("2026-10-27");
    expect(congNgay("2026-12-31", 1)).toBe("2027-01-01");
    expect(hienNgay(chuoiThanhNgay("2026-09-07"))).toBe("07/09/2026");
  });

  it("số ngày còn lại tính theo ngày lịch VN", () => {
    const now = new Date("2026-09-27T20:00:00Z"); // 03:00 ngày 28 giờ VN
    expect(soNgayConLai(chuoiThanhNgay("2026-09-28"), now)).toBe(0);
    expect(soNgayConLai(chuoiThanhNgay("2026-10-01"), now)).toBe(3);
  });

  it("từ chối ngày sai định dạng", () => {
    expect(() => chuoiThanhNgay("2026-02-30")).toThrow();
    expect(() => chuoiThanhNgay("27/09/2026")).toThrow();
  });
});
