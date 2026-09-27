import type { KetQuaKy } from "@/generated/prisma/client";

// Khối kết quả sau khi chốt kỳ – hoàn thiện ở bước 6.
export function KhoiKetQua({ ketQua }: { ketQua: KetQuaKy | null }) {
  if (!ketQua) return null;
  return null;
}
