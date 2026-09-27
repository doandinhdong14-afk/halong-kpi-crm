// Lớp lưu file. Hiện dùng ổ đĩa server (UPLOAD_DIR, trên Railway là Volume).
// Muốn đổi sang S3/R2 chỉ cần viết implementation khác của KhoFile.
import "server-only";
import { KhoFileODia } from "./o-dia";

export interface KhoFile {
  /** Lưu nội dung, trả về khóa (đường dẫn tương đối) để ghi vào FileDinhKem.duongDan. */
  luu(noiDung: Buffer, duoi: string): Promise<string>;
  /** Mở luồng đọc file theo khóa. */
  doc(khoa: string): Promise<{ stream: ReadableStream<Uint8Array>; kichThuoc: number }>;
  /** Xóa file; không báo lỗi nếu file không còn. */
  xoa(khoa: string): Promise<void>;
}

export const khoFile: KhoFile = new KhoFileODia(process.env.UPLOAD_DIR || "./uploads");

/** Xóa nhiều file, bỏ qua lỗi từng file (dọn dẹp sau khi đã xóa bản ghi DB). */
export async function xoaNhieuFile(khoas: string[]) {
  await Promise.allSettled(khoas.map((k) => khoFile.xoa(k)));
}
