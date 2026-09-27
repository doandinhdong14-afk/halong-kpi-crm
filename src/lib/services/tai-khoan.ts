import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { LoiNghiepVu } from "@/lib/loi";
import { chonTenTrong, tenGoc } from "@/lib/username";

type Tx = Prisma.TransactionClient;

/**
 * Sinh tên đăng nhập theo mục 2.2. Khi sửa tài khoản, truyền boQuaUserId để không tính
 * tên hiện tại của chính tài khoản đó là "trùng" (hậu tố được tính lại từ đầu).
 */
export async function sinhTenDangNhap(tx: Tx, hoTen: string, role: Role, boQuaUserId?: string): Promise<string> {
  const goc = tenGoc(hoTen, role);
  if (!goc) throw new LoiNghiepVu("Họ tên phải có ít nhất một chữ cái hoặc chữ số.");
  const trung = await tx.user.findMany({
    where: { username: { startsWith: goc }, ...(boQuaUserId ? { id: { not: boQuaUserId } } : {}) },
    select: { username: true },
  });
  return chonTenTrong(goc, new Set(trung.map((u) => u.username)));
}

export type DonVi = { boMonId: string | null; khoaId: string | null };

/**
 * Đơn vị gán tự động theo vai trò (mục 2.4, B16): GV, TBM → bộ môn duy nhất; TK → khoa duy nhất;
 * HP (khoa phụ trách gán riêng qua Khoa.hieuPhoId), HT, Admin → không gắn đơn vị.
 */
export async function donViTheoVaiTro(tx: Tx, role: Role): Promise<DonVi> {
  if (role === "GV" || role === "TBM") {
    const boMon = await tx.boMon.findFirst({ orderBy: { ten: "asc" }, select: { id: true } });
    if (!boMon) throw new LoiNghiepVu("Chưa có bộ môn nào để gắn tài khoản.");
    return { boMonId: boMon.id, khoaId: null };
  }
  if (role === "TK") {
    const khoa = await tx.khoa.findFirst({ orderBy: { ten: "asc" }, select: { id: true } });
    if (!khoa) throw new LoiNghiepVu("Chưa có khoa nào để gắn tài khoản.");
    return { boMonId: null, khoaId: khoa.id };
  }
  return { boMonId: null, khoaId: null };
}

/** Giới hạn mục 2.4: mỗi bộ môn tối đa 1 TBM, mỗi khoa tối đa 1 TK, toàn trường tối đa 1 HT. */
export async function kiemTraGioiHan(tx: Tx, role: Role, donVi: DonVi, boQuaUserId?: string) {
  const khac = boQuaUserId ? { id: { not: boQuaUserId } } : {};
  if (role === "TBM" && donVi.boMonId) {
    const co = await tx.user.findFirst({ where: { role: "TBM", boMonId: donVi.boMonId, ...khac }, select: { username: true } });
    if (co) throw new LoiNghiepVu(`Bộ môn này đã có trưởng bộ môn (${co.username}). Hãy đổi chức vụ người đó trước.`, 409);
  }
  if (role === "TK" && donVi.khoaId) {
    const co = await tx.user.findFirst({ where: { role: "TK", khoaId: donVi.khoaId, ...khac }, select: { username: true } });
    if (co) throw new LoiNghiepVu(`Khoa này đã có trưởng khoa (${co.username}). Hãy đổi chức vụ người đó trước.`, 409);
  }
  if (role === "HT") {
    const co = await tx.user.findFirst({ where: { role: "HT", ...khac }, select: { username: true } });
    if (co) throw new LoiNghiepVu(`Trường đã có hiệu trưởng (${co.username}). Hãy đổi chức vụ người đó trước.`, 409);
  }
}

/**
 * Gán đúng danh sách khoa phụ trách cho hiệu phó: bỏ các khoa không còn chọn, nhận các khoa mới.
 * Khoa đã có hiệu phó khác → chặn (mỗi khoa tối đa 1 HP phụ trách). Cập nhật có điều kiện để
 * hai admin thao tác cùng lúc không giành cùng một khoa.
 */
export async function ganKhoaPhuTrach(tx: Tx, hpId: string, khoaIds: string[]) {
  const ids = [...new Set(khoaIds)];
  const khoas = await tx.khoa.findMany({ where: { id: { in: ids } }, select: { id: true, ten: true, hieuPhoId: true } });
  if (khoas.length !== ids.length) throw new LoiNghiepVu("Khoa phụ trách không hợp lệ.", 404);
  const daCo = khoas.find((k) => k.hieuPhoId && k.hieuPhoId !== hpId);
  if (daCo) throw new LoiNghiepVu(`${daCo.ten} đã có hiệu phó phụ trách.`, 409);

  await tx.khoa.updateMany({ where: { hieuPhoId: hpId, id: { notIn: ids } }, data: { hieuPhoId: null } });
  const { count } = await tx.khoa.updateMany({
    where: { id: { in: ids }, OR: [{ hieuPhoId: null }, { hieuPhoId: hpId }] },
    data: { hieuPhoId: hpId },
  });
  if (count !== ids.length) throw new LoiNghiepVu("Khoa vừa được gán cho hiệu phó khác, vui lòng tải lại trang.", 409);
}

/** Số kỳ chưa chốt mà tài khoản đang có dữ liệu KPI (đăng ký, task, xin thêm) – A2. */
export async function soKyCoKpiChuaChot(tx: Tx, userId: string): Promise<number> {
  const dangKys = await tx.dangKy.findMany({ where: { userId, ky: { daChot: false } }, select: { kyId: true } });
  const yeuCaus = await tx.yeuCauThemTask.findMany({ where: { userId, ky: { daChot: false } }, select: { kyId: true } });
  return new Set([...dangKys, ...yeuCaus].map((x) => x.kyId)).size;
}

/**
 * Xóa dữ liệu KPI của tài khoản ở các kỳ chưa chốt (A2: đổi chức vụ thì nhiệm vụ theo vị trí cũ
 * không còn khớp). Kỳ đã chốt giữ nguyên. Trả về đường dẫn file minh chứng cần xóa khỏi ổ đĩa
 * sau khi transaction thành công.
 */
export async function xoaKpiKyChuaChot(tx: Tx, userId: string): Promise<string[]> {
  const kyMo = { userId, ky: { daChot: false } };
  const files = await tx.fileDinhKem.findMany({ where: { baiNop: { kpiTask: kyMo } }, select: { duongDan: true } });
  await tx.kpiTask.deleteMany({ where: kyMo });
  await tx.yeuCauThemTask.deleteMany({ where: kyMo });
  await tx.dangKy.deleteMany({ where: kyMo });
  return files.map((f) => f.duongDan);
}
