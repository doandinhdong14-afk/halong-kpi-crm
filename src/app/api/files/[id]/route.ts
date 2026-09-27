// Tải/xem file qua route có kiểm tra quyền (mục 11.1):
// - Minh chứng: GV chủ task, TBM cùng bộ môn, Admin.
// - Giấy tờ: người gửi, người nhận, Admin.
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { LoiNghiepVu, xuLyApi } from "@/lib/loi";
import { khoFile } from "@/lib/storage";

const XEM_TRUC_TIEP = new Set(["application/pdf", "image/jpeg", "image/png"]);

export async function GET(req: Request, ctx: RouteContext<"/api/files/[id]">) {
  return xuLyApi(async () => {
    const u = await kiemTraVaiTro();
    const { id } = await ctx.params;
    const file = await db.fileDinhKem.findUnique({
      where: { id },
      include: {
        baiNop: { select: { gvTask: { select: { gvId: true, gv: { select: { boMonId: true } } } } } },
        vanBan: { select: { nguoiGuiId: true, nguoiNhans: { where: { userId: u.id }, select: { userId: true } } } },
      },
    });
    if (!file) throw new LoiNghiepVu("Không tìm thấy file.", 404);

    let duocXem = u.role === "ADMIN";
    if (file.baiNop) {
      const { gvId, gv } = file.baiNop.gvTask;
      duocXem ||= gvId === u.id || (u.role === "TBM" && !!u.boMonId && gv.boMonId === u.boMonId);
    } else if (file.vanBan) {
      duocXem ||= file.vanBan.nguoiGuiId === u.id || file.vanBan.nguoiNhans.length > 0;
    }
    if (!duocXem) throw new LoiNghiepVu("Bạn không có quyền xem file này.", 403);

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
