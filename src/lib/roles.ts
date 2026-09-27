import type { DoiTuong, Role } from "../generated/prisma/enums";

export const ROLES = ["ADMIN", "GV", "TBM", "TK", "HP", "HT"] as const satisfies readonly Role[];

/** Các vị trí làm KPI (mục 3.1). HT và Admin không làm KPI. */
export const DOI_TUONGS = ["GV", "TBM", "TK", "HP"] as const satisfies readonly DoiTuong[];

export const TEN_VAI_TRO: Record<Role, string> = {
  ADMIN: "Admin",
  GV: "Giáo viên",
  TBM: "Trưởng bộ môn",
  TK: "Trưởng khoa",
  HP: "Hiệu phó",
  HT: "Hiệu trưởng",
};

export const TIEN_TO: Record<Role, string> = {
  ADMIN: "admin",
  GV: "gv",
  TBM: "tbm",
  TK: "tk",
  HP: "hp",
  HT: "ht",
};

/** Chức danh viết thường để ghép câu, vd "Gửi lên trưởng bộ môn". */
export function chucDanh(role: Role): string {
  return role === "ADMIN" ? "admin" : TEN_VAI_TRO[role].toLowerCase();
}

/** Vai trò có làm KPI không (GV, TBM, TK, HP). */
export function laDoiTuong(role: Role): role is DoiTuong {
  return (DOI_TUONGS as readonly string[]).includes(role);
}
