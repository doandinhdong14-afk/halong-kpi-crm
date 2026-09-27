import { Award, CheckCircle2, XCircle } from "lucide-react";
import type { KetQuaKy } from "@/generated/prisma/client";
import type { MucTask } from "@/lib/ket-qua";
import { NHAN_KET_QUA } from "@/lib/nhan";
import { hienPhanTram } from "@/lib/tien-do";
import { cn } from "@/lib/utils";

const KIEU = {
  KHONG_DAT: { icon: XCircle, khung: "border-red-300 bg-red-50 dark:bg-red-950/30", mau: "text-red-700 dark:text-red-300" },
  DAT: { icon: CheckCircle2, khung: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30", mau: "text-emerald-700 dark:text-emerald-300" },
  VUOT: { icon: Award, khung: "border-sky-300 bg-sky-50 dark:bg-sky-950/30", mau: "text-sky-700 dark:text-sky-300" },
} as const;

/**
 * Khối kết quả sau khi chốt kỳ (mục 5.2): luôn hiện cả kết quả thực hiện và xếp loại đăng ký,
 * không gộp, không hạ bậc. GV chỉ thấy kết quả cuối cùng.
 */
export function KhoiKetQua({ ketQua }: { ketQua: KetQuaKy | null }) {
  if (!ketQua) {
    return (
      <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
        Kỳ đã chốt nhưng không có kết quả cho tài khoản của bạn.
      </div>
    );
  }
  const k = KIEU[ketQua.ketQua];
  const Icon = k.icon;
  const thieu = ketQua.taskThieu as MucTask[];
  const vuot = ketQua.taskVuot as MucTask[];

  return (
    <div className={cn("rounded-lg border p-5", k.khung)} data-testid="ket-qua">
      <div className="flex flex-wrap items-center gap-3">
        <Icon className={cn("size-8", k.mau)} />
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Kết quả kỳ</div>
          <div className={cn("text-2xl font-bold", k.mau)} data-testid="ket-qua-tieu-de">
            {NHAN_KET_QUA[ketQua.ketQua]} – {ketQua.xepLoai}
          </div>
        </div>
        <div className="ml-auto grid grid-cols-2 gap-x-6 text-sm">
          <span className="text-muted-foreground">Kết quả thực hiện</span>
          <strong>{NHAN_KET_QUA[ketQua.ketQua]}</strong>
          <span className="text-muted-foreground">Xếp loại đăng ký</span>
          <strong>{ketQua.xepLoai}</strong>
          <span className="text-muted-foreground">Hoàn thành task bắt buộc</span>
          <strong>{hienPhanTram(ketQua.phanTram)}</strong>
        </div>
      </div>

      {ketQua.ghiChu && <p className="mt-3 text-sm" data-testid="ket-qua-ghi-chu">{ketQua.ghiChu}</p>}

      {ketQua.ketQua === "KHONG_DAT" && thieu.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-sm font-medium">Task còn thiếu ({thieu.length})</div>
          <ul className="list-inside list-disc text-sm" data-testid="task-thieu">
            {thieu.map((t, i) => (
              <li key={i}>
                {t.ten} <span className="text-muted-foreground">– {t.nhiemVu}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ketQua.ketQua === "VUOT" && vuot.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-sm font-medium">Task đã làm vượt ({vuot.length})</div>
          <ul className="list-inside list-disc text-sm" data-testid="task-vuot-list">
            {vuot.map((t, i) => (
              <li key={i}>
                {t.ten} <span className="text-muted-foreground">– {t.nhiemVu}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
