import { describe, expect, it } from "vitest";
import { chonKy, chonKyHienTai } from "./ky-hien-tai";
import { chuoiThanhNgay } from "./time";

const k = (id: string, batDau: string, daCongBo = true, daChot = false) => ({
  id,
  ngayBatDau: chuoiThanhNgay(batDau),
  daCongBo,
  daChot,
});

describe("kỳ hiện tại (mục 9.1)", () => {
  it("kỳ đã bắt đầu gần nhất", () => {
    const kys = [k("k1", "2026-01-01"), k("k2", "2026-09-01"), k("k3", "2026-12-01")];
    expect(chonKyHienTai(kys, "2026-09-27")?.id).toBe("k2");
  });

  it("bỏ kỳ đã chốt / chưa công bố; không có kỳ đã bắt đầu → kỳ sắp tới gần nhất", () => {
    const kys = [k("k1", "2026-09-01", true, true), k("k2", "2026-09-10", false), k("k3", "2027-01-01"), k("k4", "2026-11-01")];
    expect(chonKyHienTai(kys, "2026-09-27")?.id).toBe("k4");
  });

  it("mọi kỳ đã chốt → kỳ công bố mới nhất; không có gì → null", () => {
    expect(chonKyHienTai([k("k1", "2026-01-01", true, true), k("k2", "2026-05-01", true, true)], "2026-09-27")?.id).toBe("k2");
    expect(chonKyHienTai([], "2026-09-27")).toBeNull();
  });

  it("chọn theo ?kyId nếu hợp lệ", () => {
    const kys = [k("k1", "2026-01-01"), k("k2", "2026-09-01")];
    expect(chonKy(kys, "k1", "2026-09-27")?.id).toBe("k1");
    expect(chonKy(kys, "khong-co", "2026-09-27")?.id).toBe("k2");
  });
});
