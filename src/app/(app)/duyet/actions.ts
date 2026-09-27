"use server";

// Màn hình Duyệt dùng chung (mục 6.1): TBM → GV, TK → TBM, HP → TK, HT → HP.
// Quyền "là người duyệt của người này" kiểm tra trong service theo cơ cấu hiện tại.
import { kiemTraVaiTro } from "@/lib/auth/dal";
import { hanhDong } from "@/lib/loi";
import { duyetDangKy as duyetDk, tuChoiDangKy as tuChoiDk } from "@/lib/services/dang-ky";
import { duyetYeuCau as duyetYc, tuChoiYeuCau as tuChoiYc } from "@/lib/services/yeu-cau";
import { docDuLieu, NhanXetBatBuoc, NhanXetTuyChon } from "@/lib/validate";

const NGUOI_DUYET = ["TBM", "TK", "HP", "HT"] as const;

export async function duyetDangKy(input: { dangKyId: string; nhanXet?: string }) {
  return hanhDong(async () => {
    const m = await kiemTraVaiTro(...NGUOI_DUYET);
    return duyetDk(m, { dangKyId: input.dangKyId, nhanXet: docDuLieu(NhanXetTuyChon, input.nhanXet) });
  });
}

export async function tuChoiDangKy(input: { dangKyId: string; nhanXet: string }) {
  return hanhDong(async () => {
    const m = await kiemTraVaiTro(...NGUOI_DUYET);
    return tuChoiDk(m, { dangKyId: input.dangKyId, nhanXet: docDuLieu(NhanXetBatBuoc, input.nhanXet) });
  });
}

export async function duyetYeuCau(input: { yeuCauId: string; nhanXet?: string }) {
  return hanhDong(async () => {
    const m = await kiemTraVaiTro(...NGUOI_DUYET);
    return duyetYc(m, { yeuCauId: input.yeuCauId, nhanXet: docDuLieu(NhanXetTuyChon, input.nhanXet) });
  });
}

export async function tuChoiYeuCau(input: { yeuCauId: string; nhanXet: string }) {
  return hanhDong(async () => {
    const m = await kiemTraVaiTro(...NGUOI_DUYET);
    return tuChoiYc(m, { yeuCauId: input.yeuCauId, nhanXet: docDuLieu(NhanXetBatBuoc, input.nhanXet) });
  });
}
