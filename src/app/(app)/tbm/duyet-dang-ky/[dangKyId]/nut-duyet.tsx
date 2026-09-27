"use client";

import { NutDuyetTuChoi } from "@/components/chung/nut-duyet-tu-choi";
import { duyetDangKy, tuChoiDangKy } from "../actions";

export function NutDuyetDangKy({ dangKyId }: { dangKyId: string }) {
  return (
    <NutDuyetTuChoi
      doiTuong="danh sách đăng ký"
      onDuyet={(nhanXet) => duyetDangKy({ dangKyId, nhanXet })}
      onTuChoi={(nhanXet) => tuChoiDangKy({ dangKyId, nhanXet })}
      thanhCongDuyet="Đã duyệt danh sách. Các task bắt buộc đã được giao cho giáo viên."
      thanhCongTuChoi="Đã từ chối danh sách."
    />
  );
}
