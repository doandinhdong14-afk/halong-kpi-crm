// GV nộp minh chứng (tạo lần nộp mới). Dùng route handler thay server action vì upload nhiều file lớn.
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { xuLyApi } from "@/lib/loi";
import { nopBaiMoi } from "@/lib/services/bai-nop";
import { docForm } from "@/lib/services/file-upload";

export async function POST(req: Request, ctx: RouteContext<"/api/gv-task/[id]/bai-nop">) {
  return xuLyApi(async () => {
    const gv = await kiemTraVaiTro("GV");
    const { id } = await ctx.params;
    const kq = await nopBaiMoi(gv, id, await docForm(req));
    return Response.json(kq, { status: 201 });
  });
}
