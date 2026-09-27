import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { layNguoiDung } from "@/lib/auth/dal";
import { trangChu } from "@/lib/menu";
import { FormDangNhap } from "./form-dang-nhap";

export default async function TrangDangNhap() {
  const u = await layNguoiDung();
  if (u) redirect(trangChu(u.role));

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">CRM KPI giáo viên</CardTitle>
          <CardDescription>Trường Đại học Hạ Long</CardDescription>
        </CardHeader>
        <CardContent>
          <FormDangNhap />
        </CardContent>
      </Card>
    </main>
  );
}
