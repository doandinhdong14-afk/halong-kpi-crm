import { ExternalLink } from "lucide-react";
import { BadgeTrangThai } from "@/components/chung/badge-trang-thai";
import { NHAN_DUYET } from "@/lib/nhan";
import { DanhSachFile } from "@/components/chung/danh-sach-file";
import type { BaiNopHienThi } from "@/lib/services/lich-su";
import { hienNgayGio } from "@/lib/time";

/** Ghi chú + link của một lần nộp. */
function GhiChuLink({ b }: { b: BaiNopHienThi }) {
  return (
    <>
      {b.ghiChu && (
        <p className="text-sm">
          <span className="text-muted-foreground">Ghi chú: </span>
          {b.ghiChu}
        </p>
      )}
      {b.link && (
        <p className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">Link: </span>
          <a href={b.link} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 break-all text-primary hover:underline">
            {b.link} <ExternalLink className="size-3" />
          </a>
        </p>
      )}
    </>
  );
}

/**
 * Lịch sử các lần nộp (mới nhất trước): file, thời gian, trạng thái, nhận xét của người duyệt.
 * xemNgayLanMoiNhat: xem trước PDF/ảnh của lần nộp mới nhất (màn hình Duyệt, Chốt).
 */
export function LichSuNop({ baiNops, xemNgayLanMoiNhat = false }: { baiNops: BaiNopHienThi[]; xemNgayLanMoiNhat?: boolean }) {
  if (!baiNops.length) return <p className="text-sm text-muted-foreground">Chưa có lần nộp nào.</p>;
  return (
    <ol className="space-y-3" data-testid="lich-su-nop">
      {baiNops.map((b, i) => (
        <li key={b.id} className="rounded-md border bg-background p-3" data-lan-nop={baiNops.length - i}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium">
              Lần nộp {baiNops.length - i} · {hienNgayGio(b.nopLuc)}
            </div>
            <BadgeTrangThai trangThai={b.trangThai} nhan={NHAN_DUYET[b.trangThai]} laDangKy />
          </div>
          <div className="mt-2 space-y-2">
            <DanhSachFile files={b.files} xemNgay={xemNgayLanMoiNhat && i === 0} />
            <GhiChuLink b={b} />
            {b.trangThai !== "CHO_DUYET" && (
              <p className="rounded bg-muted px-2 py-1 text-sm" data-testid="nhan-xet-duyet">
                <span className="text-muted-foreground">
                  {b.nguoiDuyet ?? "(tài khoản đã xóa)"}
                  {b.duyetLuc ? ` · ${hienNgayGio(b.duyetLuc)}` : ""}:{" "}
                </span>
                {b.nhanXet || <em className="text-muted-foreground">không có nhận xét</em>}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
