// Mọi phép tính ngày giờ nghiệp vụ theo giờ Việt Nam (UTC+7, không có giờ mùa hè).
// Không dựa vào TZ của máy chủ.
// Ngày của kỳ lưu dạng @db.Date → Prisma trả về Date lúc 00:00 UTC của ngày đó.

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const MOT_NGAY_MS = 24 * 60 * 60 * 1000;
export const TZ_VN = "Asia/Ho_Chi_Minh";

/** "YYYY-MM-DD" của một ngày lưu dạng @db.Date. */
export function ngayThanhChuoi(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Chuỗi "YYYY-MM-DD" → Date để ghi vào cột @db.Date. */
export function chuoiThanhNgay(s: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`Ngày không hợp lệ: ${s}`);
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || ngayThanhChuoi(d) !== s) throw new Error(`Ngày không hợp lệ: ${s}`);
  return d;
}

/** Ngày hôm nay theo giờ VN, dạng "YYYY-MM-DD". */
export function homNayVN(now: Date = new Date()): string {
  return new Date(now.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Cộng n ngày vào chuỗi "YYYY-MM-DD". */
export function congNgay(s: string, n: number): string {
  return ngayThanhChuoi(new Date(chuoiThanhNgay(s).getTime() + n * MOT_NGAY_MS));
}

/** 23:59:59.999 giờ VN của ngày d (@db.Date). */
export function cuoiNgayVN(d: Date): Date {
  return new Date(d.getTime() + MOT_NGAY_MS - 1 - VN_OFFSET_MS);
}

type KyNgay = { ngayBatDau: Date; ngayKetThuc: Date };

/** Hạn đăng ký = 23:59:59 ngày bắt đầu kỳ (giờ VN). */
export function hanDangKy(ky: KyNgay): Date {
  return cuoiNgayVN(ky.ngayBatDau);
}

/** Deadline = 23:59:59 ngày kết thúc kỳ (giờ VN). */
export function deadline(ky: KyNgay): Date {
  return cuoiNgayVN(ky.ngayKetThuc);
}

/** Số ngày lịch (giờ VN) từ hôm nay đến ngày d. Hôm nay = 0, ngày mai = 1. */
export function soNgayConLai(d: Date, now: Date = new Date()): number {
  const homNay = chuoiThanhNgay(homNayVN(now)).getTime();
  return Math.round((d.getTime() - homNay) / MOT_NGAY_MS);
}

const fmtNgay = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TZ_VN,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const fmtNgayGio = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TZ_VN,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** dd/MM/yyyy cho một ngày @db.Date (không lệch múi giờ). */
export function hienNgay(d: Date): string {
  const [y, m, day] = ngayThanhChuoi(d).split("-");
  return `${day}/${m}/${y}`;
}

/** dd/MM/yyyy của một thời điểm, theo giờ VN. */
export function hienNgayCuaThoiDiem(d: Date): string {
  return fmtNgay.format(d);
}

/** HH:mm dd/MM/yyyy của một thời điểm, theo giờ VN. */
export function hienNgayGio(d: Date): string {
  return fmtNgayGio.format(d);
}
