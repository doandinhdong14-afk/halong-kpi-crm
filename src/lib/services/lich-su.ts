// Lịch sử một task: các lần nộp (file, ghi chú, link, kết quả duyệt) và nhật ký hành động (LichSuTask).
import "server-only";
import type { HanhDongTask, TrangThaiDuyet } from "@/generated/prisma/enums";
import type { FileHienThi } from "@/components/chung/danh-sach-file";
import { db } from "@/lib/db";

export type BaiNopHienThi = {
  id: string;
  nopLuc: Date;
  trangThai: TrangThaiDuyet;
  ghiChu: string | null;
  link: string | null;
  nhanXet: string | null;
  duyetLuc: Date | null;
  /** Họ tên người duyệt; null nếu chưa duyệt hoặc tài khoản đã xóa. */
  nguoiDuyet: string | null;
  files: FileHienThi[];
};

export type LichSuHienThi = {
  id: string;
  hanhDong: HanhDongTask;
  luc: Date;
  nguoi: string | null;
  nhanXet: string | null;
};

async function tenTheoId(ids: (string | null)[]) {
  const ds = [...new Set(ids.filter((x): x is string => !!x))];
  const users = await db.user.findMany({ where: { id: { in: ds } }, select: { id: true, hoTen: true } });
  return new Map(users.map((u) => [u.id, u.hoTen]));
}

/** Các lần nộp của một task (mới nhất trước). */
export async function layLichSuNop(kpiTaskId: string): Promise<BaiNopHienThi[]> {
  const baiNops = await db.baiNop.findMany({
    where: { kpiTaskId },
    orderBy: { nopLuc: "desc" },
    include: {
      files: { orderBy: { taoLuc: "asc" }, select: { id: true, tenGoc: true, kichThuoc: true, mimeType: true } },
    },
  });
  const ten = await tenTheoId(baiNops.map((b) => b.nguoiDuyetId));
  return baiNops.map((b) => ({
    id: b.id,
    nopLuc: b.nopLuc,
    trangThai: b.trangThai,
    ghiChu: b.ghiChu,
    link: b.link,
    nhanXet: b.nhanXet,
    duyetLuc: b.duyetLuc,
    nguoiDuyet: b.nguoiDuyetId ? (ten.get(b.nguoiDuyetId) ?? null) : null,
    files: b.files,
  }));
}

/** Nhật ký hành động của một task (cũ nhất trước). Chỉ dùng cho cấp quản lý, admin. */
export async function layNhatKyTask(kpiTaskId: string): Promise<LichSuHienThi[]> {
  const ds = await db.lichSuTask.findMany({ where: { kpiTaskId }, orderBy: { luc: "asc" } });
  const ten = await tenTheoId(ds.map((x) => x.nguoiThucHienId));
  return ds.map((x) => ({
    id: x.id,
    hanhDong: x.hanhDong,
    luc: x.luc,
    nguoi: x.nguoiThucHienId ? (ten.get(x.nguoiThucHienId) ?? null) : null,
    nhanXet: x.nhanXet,
  }));
}
