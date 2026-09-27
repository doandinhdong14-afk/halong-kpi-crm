import { Download, FileText } from "lucide-react";
import { hienKichThuoc } from "@/lib/files";

export type FileHienThi = { id: string; tenGoc: string; kichThuoc: number; mimeType: string };

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
