import type { Role } from "@/generated/prisma/enums";

export type MucMenu = { href: string; nhan: string };

export const MENU: Record<Role, MucMenu[]> = {
  ADMIN: [
    { href: "/admin/tai-khoan", nhan: "Quản lý đăng nhập" },
    { href: "/admin/phan-viec", nhan: "Phân việc đầu kỳ" },
    { href: "/admin/chi-thi", nhan: "Nhận chỉ thị của hiệu trưởng" },
    { href: "/admin/cau-hinh", nhan: "Xem cấu hình" },
  ],
  GV: [
    { href: "/gv/dau-ky", nhan: "Đầu kỳ" },
    { href: "/gv/cuoi-ky", nhan: "Cuối kỳ" },
    { href: "/giay-to", nhan: "Nhận giấy tờ" },
  ],
  TBM: [
    { href: "/tbm/duyet-dang-ky", nhan: "Duyệt đăng ký" },
    { href: "/tbm/duyet-task", nhan: "Duyệt task" },
    { href: "/tbm/duyet-xin-them", nhan: "Duyệt xin thêm task" },
    { href: "/tbm/ket-qua", nhan: "Kết quả kỳ" },
    { href: "/giay-to", nhan: "Nhận giấy tờ" },
  ],
  TK: [
    { href: "/giay-to", nhan: "Nhận giấy tờ" },
    { href: "/dang-phat-trien", nhan: "Đang phát triển" },
  ],
  HP: [
    { href: "/giay-to", nhan: "Nhận giấy tờ" },
    { href: "/dang-phat-trien", nhan: "Đang phát triển" },
  ],
  HT: [
    { href: "/ht/ban-hanh", nhan: "Ban hành giấy tờ" },
    { href: "/ht/da-ban-hanh", nhan: "Đã ban hành" },
  ],
};

export function trangChu(role: Role): string {
  return MENU[role][0].href;
}
