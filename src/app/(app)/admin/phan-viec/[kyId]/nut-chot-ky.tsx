"use client";

import { Lock } from "lucide-react";
import { NutXacNhan } from "@/components/chung/nut-xac-nhan";
import { useHanhDong } from "@/components/chung/use-hanh-dong";
import { chotKyNgay } from "../actions";

/** Nút demo: chốt kỳ ngay, không cần chờ deadline. */
export function NutChotKy({ kyId }: { kyId: string }) {
  const { pending, chay } = useHanhDong();
  return (
    <NutXacNhan
      variant="destructive"
      nguyHiem
      tieuDe="Chốt kỳ ngay?"
      moTa="Hệ thống sẽ tính kết quả cho mọi giáo viên và khóa toàn bộ thao tác trong kỳ (nộp, duyệt, sửa). Không thể hoàn tác."
      nhanXacNhan="Chốt kỳ"
      disabled={pending}
      onXacNhan={() => chay(() => chotKyNgay(kyId), { thanhCong: (d) => `Đã chốt kỳ, tính kết quả cho ${d.soGv} giáo viên.` })}
    >
      <Lock className="size-4" /> Chốt kỳ ngay
    </NutXacNhan>
  );
}
