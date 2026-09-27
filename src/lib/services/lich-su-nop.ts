import "server-only";
import type { BaiNopHienThi } from "@/components/chung/lich-su-nop";
import { db } from "@/lib/db";

/** Các lần nộp của một GvTask (mới nhất trước), kèm tên người duyệt. */
export async function layLichSuNop(gvTaskId: string): Promise<BaiNopHienThi[]> {
  const baiNops = await db.baiNop.findMany({
    where: { gvTaskId },
    orderBy: { nopLuc: "desc" },
    include: { files: { orderBy: { taoLuc: "asc" }, select: { id: true, tenGoc: true, kichThuoc: true } } },
  });
  const ids = [...new Set(baiNops.map((b) => b.nguoiDuyetId).filter((x): x is string => !!x))];
  const nguoi = new Map(
    (await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, hoTen: true } })).map((u) => [u.id, u.hoTen]),
  );
  return baiNops.map((b) => ({
    id: b.id,
    nopLuc: b.nopLuc,
    trangThai: b.trangThai,
    ghiChu: b.ghiChu,
    link: b.link,
    nhanXet: b.nhanXet,
    duyetLuc: b.duyetLuc,
    nguoiDuyet: b.nguoiDuyetId ? (nguoi.get(b.nguoiDuyetId) ?? null) : null,
    files: b.files,
  }));
}
