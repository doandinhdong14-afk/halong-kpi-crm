import { Download, ExternalLink, FileText } from "lucide-react";
import { BadgeTrangThai } from "@/components/chung/badge-trang-thai";
import { hienKichThuoc } from "@/lib/files";
import { NHAN_DUYET } from "@/lib/nhan";
import type { BaiNopHienThi, FileHienThi } from "@/lib/services/lich-su";
import { hienNgayGio } from "@/lib/time";

const XEM_NGAY = new Set(["application/pdf", "image/jpeg", "image/png"]);

/**
 * Danh sách file qua /api/files/[id] (có kiểm tra quyền). xemNgay: PDF và ảnh hiện ngay trên trang,
 * Word/Excel tải về (mục 6.1).
 */
export function DanhSachFile({ files, xemNgay = false }: { files: FileHienThi[]; xemNgay?: boolean }) {
  if (!files.length) return <p className="text-sm text-muted-foreground">Không có file.</p>;
  return (
    <div className="space-y-3">
      <ul className="space-y-1">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-2 text-sm" data-file={f.tenGoc}>
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <a href={`/api/files/${f.id}`} target="_blank" rel="noopener" className="truncate text-primary hover:underline">
              {f.tenGoc}
            </a>
            <span className="shrink-0 text-xs text-muted-foreground">{hienKichThuoc(f.kichThuoc)}</span>
            <a href={`/api/files/${f.id}?tai=1`} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label={`Tải ${f.tenGoc}`}>
              <Download className="size-4" />
            </a>
          </li>
        ))}
      </ul>
      {xemNgay &&
        files
          .filter((f) => XEM_NGAY.has(f.mimeType))
          .map((f) =>
            f.mimeType === "application/pdf" ? (
              <iframe
                key={f.id}
                src={`/api/files/${f.id}`}
                title={f.tenGoc}
                className="h-[480px] w-full rounded-md border bg-muted"
                data-xem-truoc={f.tenGoc}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh qua route có kiểm tra quyền, không tối ưu qua next/image
              <img
                key={f.id}
                src={`/api/files/${f.id}`}
                alt={f.tenGoc}
                className="max-h-[480px] rounded-md border"
                data-xem-truoc={f.tenGoc}
              />
            ),
          )}
    </div>
  );
}

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
