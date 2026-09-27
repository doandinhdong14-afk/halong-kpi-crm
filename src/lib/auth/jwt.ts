// Ký/kiểm tra token phiên. Dùng được cả ở proxy và server.
import { SignJWT, jwtVerify } from "jose";

export const TEN_COOKIE = "phien";
export const THOI_HAN_GIAY = 7 * 24 * 60 * 60;

function khoa() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("Thiếu AUTH_SECRET (tối thiểu 16 ký tự)");
  return new TextEncoder().encode(s);
}

export async function kyToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${THOI_HAN_GIAY}s`)
    .sign(khoa());
}

/** Trả về userId nếu token hợp lệ, ngược lại null. */
export async function docToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, khoa(), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
