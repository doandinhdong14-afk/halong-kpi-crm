// Người làm KPI nộp minh chứng (tạo lần nộp mới). Route handler thay server action vì upload nhiều file lớn.
import { kiemTraNguoiLamKpi } from "@/lib/auth/dal";
import { xuLyApi } from "@/lib/loi";
import { nopBaiMoi } from "@/lib/services/bai-nop";
import { docForm } from "@/lib/services/file-upload";

export async function POST(req: Request, ctx: RouteContext<"/api/kpi-task/[id]/bai-nop">) {
  return xuLyApi(async () => {
    const u = await kiemTraNguoiLamKpi();
    const { id } = await ctx.params;
    return Response.json(await nopBaiMoi(u, id, await docForm(req)), { status: 201 });
  });
}
