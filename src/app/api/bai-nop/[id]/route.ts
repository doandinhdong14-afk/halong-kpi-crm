// GV sửa/thay minh chứng của lần nộp hiện tại (chỉ khi Chờ duyệt).
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { xuLyApi } from "@/lib/loi";
import { suaBaiNop } from "@/lib/services/bai-nop";
import { docForm } from "@/lib/services/file-upload";

export async function PATCH(req: Request, ctx: RouteContext<"/api/bai-nop/[id]">) {
  return xuLyApi(async () => {
    const gv = await kiemTraVaiTro("GV");
    const { id } = await ctx.params;
    return Response.json(await suaBaiNop(gv, id, await docForm(req)));
  });
}
