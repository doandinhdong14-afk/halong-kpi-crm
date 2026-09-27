// Tính kết quả một GV khi chốt kỳ (mục 9.3). Hàm thuần.
import type { KetQua, LoaiTask, TrangThaiDangKy, TrangThaiTask } from "@/generated/prisma/enums";
import { thongKeTienDo } from "@/lib/tien-do";

export type TaskKetQua = { ten: string; nhiemVu: string; loai: LoaiTask; trangThai: TrangThaiTask };
export type MucTask = { ten: string; nhiemVu: string };

export type KetQuaGv = {
  ketQua: KetQua;
  xepLoai: string;
  phanTram: number;
  taskThieu: MucTask[];
  taskVuot: MucTask[];
  ghiChu: string | null;
};

export const GHI_CHU_CHUA_DUYET = "Chưa có danh sách nhiệm vụ được duyệt";

export function tinhKetQuaGv(input: {
  dangKy: { trangThai: TrangThaiDangKy; xepLoai: string | null } | null;
  tasks: TaskKetQua[];
  bacThapNhat: string | null;
}): KetQuaGv {
  const thapNhat = input.bacThapNhat ?? "—";
  if (!input.dangKy || input.dangKy.trangThai !== "DA_DUYET") {
    return { ketQua: "KHONG_DAT", xepLoai: thapNhat, phanTram: 0, taskThieu: [], taskVuot: [], ghiChu: GHI_CHU_CHUA_DUYET };
  }
  const tk = thongKeTienDo(input.tasks);
  const muc = (t: TaskKetQua): MucTask => ({ ten: t.ten, nhiemVu: t.nhiemVu });
  const taskThieu = input.tasks.filter((t) => t.loai === "BAT_BUOC" && t.trangThai !== "DA_DUYET").map(muc);
  const taskVuot = input.tasks.filter((t) => t.loai === "MO_RONG" && t.trangThai === "DA_DUYET").map(muc);
  const ketQua: KetQua = tk.phanTram < 100 ? "KHONG_DAT" : taskVuot.length > 0 ? "VUOT" : "DAT";
  return {
    ketQua,
    xepLoai: input.dangKy.xepLoai ?? thapNhat,
    phanTram: tk.phanTram,
    taskThieu: ketQua === "KHONG_DAT" ? taskThieu : [],
    taskVuot,
    ghiChu: null,
  };
}
