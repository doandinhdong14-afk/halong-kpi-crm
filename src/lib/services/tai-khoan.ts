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
