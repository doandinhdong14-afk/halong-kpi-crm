import type { z } from "zod";
import { LoiNghiepVu } from "@/lib/loi";

/** Kiểm tra dữ liệu đầu vào bằng zod; sai thì ném LoiNghiepVu với thông điệp đầu tiên. */
export function docDuLieu<T>(schema: z.ZodType<T>, v: unknown): T {
  const r = schema.safeParse(v);
  if (!r.success) throw new LoiNghiepVu(r.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
  return r.data;
}
