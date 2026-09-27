// Tiến độ task (mục 5.2 + 9.3). Hàm thuần, dùng cho biểu đồ, kết quả chốt kỳ và trang admin.
import type { LoaiTask, TrangThaiTask } from "@/generated/prisma/enums";

export type TaskTienDo = { loai: LoaiTask; trangThai: TrangThaiTask };

export type ThongKeTienDo = {
  tongBatBuoc: number;
  daDuyet: number;
  choDuyet: number;
  tuChoi: number;
  chuaLam: number;
  /** % task bắt buộc Đã duyệt. Không có task bắt buộc → 100 (quyết định #6). */
  phanTram: number;
  /** Task mở rộng đã duyệt (làm vượt). */
  soVuot: number;
};

export function thongKeTienDo(tasks: TaskTienDo[]): ThongKeTienDo {
  const bb = tasks.filter((t) => t.loai === "BAT_BUOC");
  const dem = (s: TrangThaiTask) => bb.filter((t) => t.trangThai === s).length;
  const daDuyet = dem("DA_DUYET");
  return {
    tongBatBuoc: bb.length,
    daDuyet,
    choDuyet: dem("CHO_DUYET"),
    tuChoi: dem("TU_CHOI"),
    chuaLam: dem("CHUA_LAM"),
    phanTram: bb.length === 0 ? 100 : Math.round((daDuyet / bb.length) * 10000) / 100,
    soVuot: tasks.filter((t) => t.loai === "MO_RONG" && t.trangThai === "DA_DUYET").length,
  };
}

/** Hiển thị phần trăm gọn: 100, 57.14 → "57,1". */
export function hienPhanTram(p: number): string {
  return `${Number.isInteger(p) ? p : p.toFixed(1).replace(".", ",")}%`;
}
