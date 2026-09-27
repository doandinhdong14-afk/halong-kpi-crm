import { Download, FileText } from "lucide-react";
import { hienKichThuoc } from "@/lib/files";

export type FileHienThi = { id: string; tenGoc: string; kichThuoc: number };

/** Danh sách file đính kèm: bấm tên để xem, nút tải về. Đều qua /api/files/[id] (có kiểm tra quyền). */
export function DanhSachFile({ files }: { files: FileHienThi[] }) {
  if (!files.length) return <p className="text-sm text-muted-foreground">Không có file.</p>;
  return (
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
  );
}
