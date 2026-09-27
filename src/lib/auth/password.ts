import bcrypt from "bcryptjs";

export const MAT_KHAU_MAC_DINH = "123456";

export function hashMatKhau(matKhau: string): Promise<string> {
  return bcrypt.hash(matKhau, 10);
}

export function kiemTraMatKhau(matKhau: string, hash: string): Promise<boolean> {
  return bcrypt.compare(matKhau, hash);
}
