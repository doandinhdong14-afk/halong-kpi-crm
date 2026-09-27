// Menu theo vai trò, đúng bảng 2.1 của đặc tả. Màn hình dùng chung (Đầu kỳ, Cuối kỳ, Duyệt, Chốt,
// Xuất báo cáo, Nhận giấy tờ) chỉ có một đường dẫn; tên mục khác nhau theo vai trò.
import type { Role } from "@/generated/prisma/enums";

export type MucMenu = { href: string; nhan: string };

const DAU_KY: MucMenu = { href: "/dau-ky", nhan: "Đầu kỳ" };
const CUOI_KY: MucMenu = { href: "/cuoi-ky", nhan: "Cuối kỳ" };
const BAO_CAO: MucMenu = { href: "/bao-cao", nhan: "Xuất báo cáo" };
const GIAY_TO: MucMenu = { href: "/giay-to", nhan: "Nhận giấy tờ" };

export const MENU: Record<Role, MucMenu[]> = {
  ADMIN: [
    { href: "/admin/tai-khoan", nhan: "Quản lý đăng nhập" },
    { href: "/admin/phan-viec", nhan: "Phân việc đầu kỳ" },
    { href: "/admin/chi-thi", nhan: "Nhận chỉ thị của hiệu trưởng" },
    { href: "/admin/cau-hinh", nhan: "Xem cấu hình" },
  ],
  GV: [DAU_KY, CUOI_KY, GIAY_TO],
  TBM: [DAU_KY, CUOI_KY, { href: "/duyet", nhan: "Duyệt giáo viên" }, BAO_CAO, GIAY_TO],
  TK: [
    DAU_KY,
    CUOI_KY,
    { href: "/duyet", nhan: "Duyệt trưởng bộ môn" },
    { href: "/chot", nhan: "Chốt task giáo viên" },
    BAO_CAO,
    GIAY_TO,
  ],
  HP: [
    DAU_KY,
    CUOI_KY,
    { href: "/duyet", nhan: "Duyệt trưởng khoa" },
    { href: "/chot", nhan: "Chốt task trưởng bộ môn" },
    BAO_CAO,
    GIAY_TO,
  ],
  HT: [
    { href: "/chot", nhan: "Chốt task trưởng khoa" },
    { href: "/duyet", nhan: "Duyệt & chốt hiệu phó" },
    { href: "/quy-dinh", nhan: "Ban hành quy định" },
    BAO_CAO,
  ],
};

export function trangChu(role: Role): string {
  return MENU[role][0].href;
}

/** Tên mục menu của một đường dẫn theo vai trò (làm tiêu đề trang dùng chung). */
export function tenMuc(role: Role, href: string): string {
  return MENU[role].find((m) => m.href === href)?.nhan ?? "";
}
