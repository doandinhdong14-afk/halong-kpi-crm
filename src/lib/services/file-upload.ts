import "server-only";
import { basename } from "node:path";
import { LoiNghiepVu } from "@/lib/loi";
import {
  duoiFile,
  KICH_THUOC_TOI_DA,
  LOAI_FILE,
  lyDoFileKhongHopLe,
  lyDoLinkKhongHopLe,
  SO_FILE_TOI_DA,
} from "@/lib/files";
import { khoFile, xoaNhieuFile } from "@/lib/storage";

export type FileDaLuu = { tenGoc: string; duongDan: string; mimeType: string; kichThuoc: number };

/** Chặn sớm request quá lớn (trước khi đọc body vào bộ nhớ). */
export function kiemTraDoLonRequest(req: Request) {
  const n = Number(req.headers.get("content-length") ?? 0);
  if (n > KICH_THUOC_TOI_DA * SO_FILE_TOI_DA + 1024 * 1024) {
    throw new LoiNghiepVu(`Dung lượng gửi lên quá lớn (tối đa ${SO_FILE_TOI_DA} file × 20MB).`, 400);
  }
}

/** Đọc multipart form; lỗi định dạng → LoiNghiepVu. */
export async function docForm(req: Request): Promise<FormData> {
  kiemTraDoLonRequest(req);
  try {
    return await req.formData();
  } catch {
    throw new LoiNghiepVu("Dữ liệu gửi lên không hợp lệ.");
  }
}

/** Lấy các file hợp lệ trong form (field "files"); sai định dạng/kích thước → lỗi. */
export function layFile(form: FormData, soFileDaCo = 0): File[] {
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.name !== "");
  if (files.length + soFileDaCo > SO_FILE_TOI_DA) throw new LoiNghiepVu(`Tối đa ${SO_FILE_TOI_DA} file cho mỗi lần nộp.`);
  for (const f of files) {
    const lyDo = lyDoFileKhongHopLe(f);
    if (lyDo) throw new LoiNghiepVu(lyDo);
  }
  return files;
}

export function layChuoi(form: FormData, ten: string, toiDa = 2000): string | null {
  const v = form.get(ten);
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s.length > toiDa) throw new LoiNghiepVu(`Nội dung "${ten}" quá dài (tối đa ${toiDa} ký tự).`);
  return s || null;
}

export function layLink(form: FormData): string | null {
  const link = layChuoi(form, "link", 1000);
  if (link) {
    const lyDo = lyDoLinkKhongHopLe(link);
    if (lyDo) throw new LoiNghiepVu(lyDo);
  }
  return link;
}

/** Ghi file xuống kho. Lỗi giữa chừng → xóa các file đã ghi. */
export async function luuFiles(files: File[]): Promise<FileDaLuu[]> {
  const daLuu: FileDaLuu[] = [];
  try {
    for (const f of files) {
      const duoi = duoiFile(f.name);
      const duongDan = await khoFile.luu(Buffer.from(await f.arrayBuffer()), duoi);
      daLuu.push({
        tenGoc: basename(f.name).slice(0, 255),
        duongDan,
        mimeType: LOAI_FILE[duoi],
        kichThuoc: f.size,
      });
    }
    return daLuu;
  } catch (e) {
    await xoaNhieuFile(daLuu.map((f) => f.duongDan));
    throw e;
  }
}
