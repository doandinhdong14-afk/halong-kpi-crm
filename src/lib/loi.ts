import { unstable_rethrow } from "next/navigation";
import { refresh } from "next/cache";

/** Lỗi nghiệp vụ: thông điệp tiếng Việt được trả thẳng cho người dùng. */
export class LoiNghiepVu extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 401 | 403 | 404 | 409 = 400,
  ) {
    super(message);
    this.name = "LoiNghiepVu";
  }
}

/** Ném LoiNghiepVu nếu có lý do chặn. */
export function chan(lyDo: string | null | undefined, status: 400 | 403 | 409 = 400): void {
  if (lyDo) throw new LoiNghiepVu(lyDo, status);
}

export type KetQuaHanhDong<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Bọc server action: đổi LoiNghiepVu thành { ok: false, error }.
 * lamMoi = true (mặc định): thành công thì làm mới router để trang hiện dữ liệu mới.
 */
export async function hanhDong<T>(fn: () => Promise<T>, lamMoi = true): Promise<KetQuaHanhDong<T>> {
  try {
    const data = await fn();
    if (lamMoi) refresh();
    return { ok: true, data };
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof LoiNghiepVu) return { ok: false, error: e.message };
    if (laLoiTrung(e)) return { ok: false, error: "Dữ liệu bị trùng (có thể người khác vừa thao tác), vui lòng thử lại." };
    console.error(e);
    return { ok: false, error: "Có lỗi xảy ra, vui lòng thử lại." };
  }
}

/** Lỗi vi phạm ràng buộc unique của Prisma (P2002). */
function laLoiTrung(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: unknown }).code === "P2002";
}

/** Bọc route handler: đổi LoiNghiepVu thành JSON { error } với mã HTTP tương ứng. */
export async function xuLyApi(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof LoiNghiepVu) return Response.json({ error: e.message }, { status: e.status });
    console.error(e);
    return Response.json({ error: "Có lỗi xảy ra, vui lòng thử lại." }, { status: 500 });
  }
}
