// Quy tắc tên đăng nhập (mục 2.2): <tiền tố>.<họ tên không dấu, viết thường, viết liền>,
// trùng thì thêm số từ 2. Không dùng alias "@/" để seed (tsx) import được.
import type { Role } from "../generated/prisma/enums";
import { TIEN_TO } from "./roles";

/** Bỏ dấu tiếng Việt, đ → d, chỉ giữ a-z0-9. */
export function boDau(hoTen: string): string {
  return hoTen
    .replace(/[đĐ]/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Tên gốc chưa xét trùng, vd "gv.nguyenvannam". Rỗng phần tên → null. */
export function tenGoc(hoTen: string, role: Role): string | null {
  const ten = boDau(hoTen);
  if (!ten) return null;
  return `${TIEN_TO[role]}.${ten}`;
}

/** Chọn tên trống: gốc, rồi gốc2, gốc3… (số trống nhỏ nhất từ 2). */
export function chonTenTrong(goc: string, daDung: Set<string>): string {
  if (!daDung.has(goc)) return goc;
  for (let n = 2; ; n++) {
    const ten = `${goc}${n}`;
    if (!daDung.has(ten)) return ten;
  }
}
