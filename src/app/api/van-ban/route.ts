// HT ban hành giấy tờ (có file đính kèm → route handler).
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { xuLyApi } from "@/lib/loi";
import { docForm } from "@/lib/services/file-upload";
import { banHanhVanBan } from "@/lib/services/van-ban";

export async function POST(req: Request) {
  return xuLyApi(async () => {
    const ht = await kiemTraVaiTro("HT");
    return Response.json(await banHanhVanBan(ht, await docForm(req)), { status: 201 });
  });
}
