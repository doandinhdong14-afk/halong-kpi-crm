import { z } from "zod";
import { LoiNghiepVu } from "@/lib/loi";

/** Kiểm tra dữ liệu đầu vào bằng zod; sai thì ném LoiNghiepVu với thông điệp đầu tiên. */
export function docDuLieu<T>(schema: z.ZodType<T>, v: unknown): T {
  const r = schema.safeParse(v);
  if (!r.success) throw new LoiNghiepVu(r.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
  return r.data;
}

/** Nhận xét bắt buộc (từ chối, trả về, trả làm lại). */
export const NhanXetBatBuoc = z
  .string({ message: "Vui lòng nhập nhận xét." })
  .trim()
  .min(1, "Vui lòng nhập nhận xét.")
  .max(2000, "Nhận xét tối đa 2000 ký tự.");

/** Nhận xét không bắt buộc (duyệt). Rỗng → null. */
export const NhanXetTuyChon = z
  .string()
  .trim()
  .max(2000, "Nhận xét tối đa 2000 ký tự.")
  .optional()
  .nullable()
  .transform((s) => s || null);
