// Tải/xem file qua route có kiểm tra quyền (ghi chú 12.2). Không phục vụ UPLOAD_DIR dạng file tĩnh.
// PDF/ảnh: Content-Disposition inline (xem ngay trên trang); loại khác hoặc ?tai=1: tải về.
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { LoiNghiepVu, xuLyApi } from "@/lib/loi";
import { layFileDuocXem } from "@/lib/services/quyen-file";
import { khoFile } from "@/lib/storage";

const XEM_TRUC_TIEP = new Set(["application/pdf", "image/jpeg", "image/png"]);

export async function GET(req: Request, ctx: RouteContext<"/api/files/[id]">) {
  return xuLyApi(async () => {
    const u = await kiemTraVaiTro();
    const { id } = await ctx.params;
    const file = await layFileDuocXem(u, id);

    let noiDung;
    try {
      noiDung = await khoFile.doc(file.duongDan);
    } catch {
      throw new LoiNghiepVu("File không còn trên máy chủ.", 404);
    }
    const taiVe = new URL(req.url).searchParams.has("tai") || !XEM_TRUC_TIEP.has(file.mimeType);
    const tenAscii = file.tenGoc.normalize("NFD").replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
    return new Response(noiDung.stream, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(noiDung.kichThuoc),
        "Content-Disposition": `${taiVe ? "attachment" : "inline"}; filename="${tenAscii}"; filename*=UTF-8''${encodeURIComponent(file.tenGoc)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  });
}
