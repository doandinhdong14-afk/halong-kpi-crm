import type { Role } from "../generated/prisma/enums";

export const ROLES = ["ADMIN", "GV", "TBM", "TK", "HP", "HT"] as const satisfies readonly Role[];

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
