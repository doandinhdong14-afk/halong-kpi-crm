// Chuông thông báo: 20 thông báo mới nhất + số chưa đọc của người dùng hiện tại.
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { xuLyApi } from "@/lib/loi";

export async function GET() {
  return xuLyApi(async () => {
    const u = await kiemTraVaiTro();
    const [chuaDoc, items] = await Promise.all([
      db.thongBao.count({ where: { userId: u.id, daDoc: false } }),
      db.thongBao.findMany({
        where: { userId: u.id },
        orderBy: { taoLuc: "desc" },
        take: 20,
        select: { id: true, noiDung: true, link: true, daDoc: true, taoLuc: true },
      }),
    ]);
    return Response.json({ chuaDoc, items }, { headers: { "Cache-Control": "no-store" } });
  });
}
