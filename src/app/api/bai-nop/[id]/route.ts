// Người làm KPI sửa/thay minh chứng của lần nộp hiện tại (chỉ khi task còn Chờ duyệt).
import { kiemTraNguoiLamKpi } from "@/lib/auth/dal";
import { xuLyApi } from "@/lib/loi";
import { suaBaiNop } from "@/lib/services/bai-nop";
import { docForm } from "@/lib/services/file-upload";

export async function PATCH(req: Request, ctx: RouteContext<"/api/bai-nop/[id]">) {
  return xuLyApi(async () => {
    const u = await kiemTraNguoiLamKpi();
    const { id } = await ctx.params;
    return Response.json(await suaBaiNop(u, id, await docForm(req)));
  });
}
