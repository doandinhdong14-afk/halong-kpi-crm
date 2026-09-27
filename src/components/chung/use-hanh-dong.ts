"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { KetQuaHanhDong } from "@/lib/loi";

/** Gọi server action trong transition, tự hiện toast lỗi/thành công. */
export function useHanhDong() {
  const [pending, startTransition] = useTransition();

  function chay<T>(
    fn: () => Promise<KetQuaHanhDong<T>>,
    opts: { thanhCong?: string | ((data: T) => string | undefined); sau?: (data: T) => void } = {},
  ) {
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      const msg = typeof opts.thanhCong === "function" ? opts.thanhCong(r.data) : opts.thanhCong;
      if (msg) toast.success(msg);
      opts.sau?.(r.data);
    });
  }

  return { pending, chay };
}
