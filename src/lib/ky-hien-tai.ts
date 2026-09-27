// "Kỳ hiện tại" (mục 9.1): kỳ đã công bố, chưa chốt, có ngày bắt đầu gần nhất ≤ hôm nay;
// không có thì lấy kỳ sắp tới gần nhất. Không còn kỳ nào mở thì lấy kỳ mới nhất (để xem lại).
import { ngayThanhChuoi } from "@/lib/time";

type KyChon = { id: string; ngayBatDau: Date; daCongBo: boolean; daChot: boolean };

export function chonKyHienTai<T extends KyChon>(kys: T[], homNay: string): T | null {
  const mo = kys.filter((k) => k.daCongBo && !k.daChot);
  const daBatDau = mo.filter((k) => ngayThanhChuoi(k.ngayBatDau) <= homNay);
  if (daBatDau.length) return daBatDau.reduce((a, b) => (b.ngayBatDau > a.ngayBatDau ? b : a));
  const sapToi = mo.filter((k) => ngayThanhChuoi(k.ngayBatDau) > homNay);
  if (sapToi.length) return sapToi.reduce((a, b) => (b.ngayBatDau < a.ngayBatDau ? b : a));
  const congBo = kys.filter((k) => k.daCongBo);
  if (congBo.length) return congBo.reduce((a, b) => (b.ngayBatDau > a.ngayBatDau ? b : a));
  return null;
}

/** Chọn kỳ theo ?kyId= nếu hợp lệ, ngược lại kỳ hiện tại. */
export function chonKy<T extends KyChon>(kys: T[], kyId: string | undefined, homNay: string): T | null {
  return kys.find((k) => k.id === kyId) ?? chonKyHienTai(kys, homNay);
}
