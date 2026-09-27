// Nhãn tiếng Việt cho các trạng thái.
import type { KetQua, LoaiTask, TrangThaiDangKy, TrangThaiDuyet, TrangThaiTask } from "@/generated/prisma/enums";

export const NHAN_DANG_KY: Record<TrangThaiDangKy, string> = {
  NHAP: "Nháp",
  CHO_DUYET: "Chờ duyệt",
  TU_CHOI: "Bị từ chối",
  DA_DUYET: "Đã duyệt",
};

export const NHAN_TASK: Record<TrangThaiTask, string> = {
  CHUA_LAM: "Chưa làm",
  CHO_DUYET: "Chờ duyệt",
  TU_CHOI: "Bị từ chối",
  DA_DUYET: "Đã duyệt",
};

export const NHAN_DUYET: Record<TrangThaiDuyet, string> = {
  CHO_DUYET: "Chờ duyệt",
  TU_CHOI: "Bị từ chối",
  DA_DUYET: "Đã duyệt",
};

export const NHAN_LOAI_TASK: Record<LoaiTask, string> = { BAT_BUOC: "Bắt buộc", MO_RONG: "Mở rộng" };

export const NHAN_KET_QUA: Record<KetQua, string> = {
  KHONG_DAT: "Không đạt",
  DAT: "Đạt",
  VUOT: "Vượt chỉ tiêu",
};
