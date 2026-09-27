// Luật file minh chứng / giấy tờ (mục 3): PDF, JPG, PNG, DOC/DOCX, XLS/XLSX, tối đa 20MB/file.
// Hằng số dùng được ở client (kiểm tra trước khi gửi); kiểm tra thật nằm ở server.

export const KICH_THUOC_TOI_DA = 20 * 1024 * 1024;
export const SO_FILE_TOI_DA = 10;

export const LOAI_FILE: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export const ACCEPT_FILE = Object.keys(LOAI_FILE).join(",");

export function duoiFile(ten: string): string {
  const i = ten.lastIndexOf(".");
  return i >= 0 ? ten.slice(i).toLowerCase() : "";
}

/** Lý do file không hợp lệ, hoặc null. */
export function lyDoFileKhongHopLe(f: { name: string; size: number }): string | null {
  if (!LOAI_FILE[duoiFile(f.name)]) {
    return `File "${f.name}" sai định dạng. Chỉ nhận PDF, JPG, PNG, DOC/DOCX, XLS/XLSX.`;
  }
  if (f.size > KICH_THUOC_TOI_DA) return `File "${f.name}" vượt quá 20MB.`;
  if (f.size === 0) return `File "${f.name}" rỗng.`;
  return null;
}

/** Link (không bắt buộc) phải là http/https. */
export function lyDoLinkKhongHopLe(link: string): string | null {
  if (!link) return null;
  try {
    const u = new URL(link);
    return u.protocol === "http:" || u.protocol === "https:" ? null : "Link phải bắt đầu bằng http:// hoặc https://";
  } catch {
    return "Link không hợp lệ (phải bắt đầu bằng http:// hoặc https://).";
  }
}

export function hienKichThuoc(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
