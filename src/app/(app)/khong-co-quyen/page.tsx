import Link from "next/link";
import { Button } from "@/components/ui/button";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { trangChu } from "@/lib/menu";

export default async function TrangKhongCoQuyen() {
  const u = await yeuCauVaiTro();
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold">Không có quyền truy cập</h1>
      <p className="mt-2 text-muted-foreground">Trang này không dành cho vai trò của bạn.</p>
      <Button asChild className="mt-6">
        <Link href={trangChu(u.role)}>Về trang chính</Link>
      </Button>
    </div>
  );
}
