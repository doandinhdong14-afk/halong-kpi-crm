import { deadline, hanDangKy, hienNgay, hienNgayGio } from "@/lib/time";

type KyHienThi = { ngayBatDau: Date; ngayKetThuc: Date; daCongBo: boolean; daChot: boolean };

export function trangThaiKy(ky: KyHienThi): "Chưa công bố" | "Đã công bố" | "Đã chốt" {
  if (ky.daChot) return "Đã chốt";
  return ky.daCongBo ? "Đã công bố" : "Chưa công bố";
}

export function moTaThoiGianKy(ky: KyHienThi) {
  return {
    batDau: hienNgay(ky.ngayBatDau),
    ketThuc: hienNgay(ky.ngayKetThuc),
    hanDangKy: hienNgayGio(hanDangKy(ky)),
    deadline: hienNgayGio(deadline(ky)),
  };
}
