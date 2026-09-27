import { ExternalLink } from "lucide-react";
import { NHAN_DUYET } from "@/lib/nhan";
import { hienNgayGio } from "@/lib/time";
import { BadgeTrangThai } from "./badge-trang-thai";
import { DanhSachFile, type FileHienThi } from "./danh-sach-file";

export type BaiNopHienThi = {
  id: string;
  nopLuc: Date;
  trangThai: keyof typeof NHAN_DUYET;
  ghiChu: string | null;
  link: string | null;
  nhanXet: string | null;
  duyetLuc: Date | null;
  nguoiDuyet: string | null;
  files: FileHienThi[];
};

/** Lịch sử các lần nộp (mới nhất trước): file, thời gian, trạng thái, nhận xét TBM. */
export function LichSuNop({ baiNops }: { baiNops: BaiNopHienThi[] }) {
  if (!baiNops.length) return <p className="text-sm text-muted-foreground">Chưa có lần nộp nào.</p>;
  return (
    <ol className="space-y-3" data-testid="lich-su-nop">
      {baiNops.map((b, i) => (
        <li key={b.id} className="rounded-md border bg-background p-3" data-lan-nop={baiNops.length - i}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium">
              Lần nộp {baiNops.length - i} · {hienNgayGio(b.nopLuc)}
            </div>
            <BadgeTrangThai trangThai={b.trangThai} nhan={NHAN_DUYET[b.trangThai]} />
          </div>
          <div className="mt-2 space-y-2">
            <DanhSachFile files={b.files} />
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
            {b.trangThai !== "CHO_DUYET" && (
              <p className="rounded bg-muted px-2 py-1 text-sm">
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
