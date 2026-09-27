"use client";

import { NutDuyetTuChoi } from "@/components/chung/nut-duyet-tu-choi";
import { duyetYeuCau, tuChoiYeuCau } from "./actions";

export function NutDuyetYeuCau({ yeuCauId }: { yeuCauId: string }) {
  return (
    <NutDuyetTuChoi
      size="sm"
      doiTuong="yêu cầu làm thêm task"
      onDuyet={(nhanXet) => duyetYeuCau({ yeuCauId, nhanXet })}
      onTuChoi={(nhanXet) => tuChoiYeuCau({ yeuCauId, nhanXet })}
      thanhCongDuyet="Đã duyệt. Task được thêm vào danh sách của giáo viên."
      thanhCongTuChoi="Đã từ chối yêu cầu."
    />
  );
}
