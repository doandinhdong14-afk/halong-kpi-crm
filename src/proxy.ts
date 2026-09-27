// Proxy chỉ chặn người chưa đăng nhập. Quyền theo vai trò kiểm tra ở từng page/action
// (src/lib/auth/dal.ts). /api không đi qua proxy: tự kiểm tra quyền, và tránh proxy
// cắt body upload ở 10MB.
import { NextResponse, type NextRequest } from "next/server";
import { TEN_COOKIE, docToken } from "@/lib/auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = await docToken(request.cookies.get(TEN_COOKIE)?.value);
  const laTrangDangNhap = pathname === "/dang-nhap";

  if (!userId && !laTrangDangNhap) {
    return NextResponse.redirect(new URL("/dang-nhap", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
