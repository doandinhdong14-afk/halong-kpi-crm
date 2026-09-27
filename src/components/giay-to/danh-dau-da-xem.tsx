"use client";

import { useEffect, useRef } from "react";
import { danhDauDaXem } from "./actions";

/**
 * Ghi nhận đã xem khi người nhận thực sự mở trang (chạy ở trình duyệt, không ghi lúc render
 * để prefetch không đánh dấu nhầm).
 */
export function DanhDauDaXem({ vanBanId }: { vanBanId: string }) {
  const daGoi = useRef(false);
  useEffect(() => {
    if (daGoi.current) return;
    daGoi.current = true;
    void danhDauDaXem(vanBanId);
  }, [vanBanId]);
  return null;
}
