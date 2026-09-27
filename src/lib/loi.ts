import { unstable_rethrow } from "next/navigation";

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

/** Bọc server action: đổi LoiNghiepVu thành { ok: false, error }. */
export async function hanhDong<T>(fn: () => Promise<T>): Promise<KetQuaHanhDong<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof LoiNghiepVu) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Có lỗi xảy ra, vui lòng thử lại." };
  }
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
