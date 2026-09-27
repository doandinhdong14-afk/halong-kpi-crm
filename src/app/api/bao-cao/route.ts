// Xuất báo cáo (mục 6.3): GET /api/bao-cao?kyId=&viTri=GV&viTri=TBM&nguoiId=&dinhDang=xlsx|pdf
// Phạm vi theo vai trò kiểm tra ở server (phamViBaoCao). Xuất được bất cứ lúc nào (chỉ đọc).
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { layDuLieuBaoCao } from "@/lib/bao-cao/du-lieu";
import { taoExcel } from "@/lib/bao-cao/excel";
import { taoPdf } from "@/lib/bao-cao/pdf";
import { tenFileBaoCao } from "@/lib/bao-cao/ten-file";
import { LoiNghiepVu, xuLyApi } from "@/lib/loi";

const LOAI = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
} as const;

export async function GET(req: Request) {
  return xuLyApi(async () => {
    const m = await kiemTraVaiTro("TBM", "TK", "HP", "HT");
    const sp = new URL(req.url).searchParams;
    const dinhDang = sp.get("dinhDang");
    if (dinhDang !== "xlsx" && dinhDang !== "pdf") throw new LoiNghiepVu("Định dạng không hợp lệ (xlsx hoặc pdf).");
    const d = await layDuLieuBaoCao(m, {
      kyId: sp.get("kyId") ?? "",
      viTris: sp.getAll("viTri"),
      nguoiId: sp.get("nguoiId") || null,
    });
    const noiDung = dinhDang === "xlsx" ? await taoExcel(d) : await taoPdf(d);
    const ten = tenFileBaoCao({
      donVi: d.donVi.tenFile,
      soKy: d.ky.soKy,
      namHoc: d.ky.namHoc,
      ngay: d.ngayXuat,
      tamTinh: d.tamTinh,
      duoi: dinhDang,
    });
    return new Response(new Uint8Array(noiDung), {
      headers: {
        "Content-Type": LOAI[dinhDang],
        "Content-Disposition": `attachment; filename="${ten}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
