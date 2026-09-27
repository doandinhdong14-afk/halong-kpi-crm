"use client";

import { NutDuyetTuChoi } from "@/components/chung/nut-duyet-tu-choi";
import { duyetBaiNop, tuChoiBaiNop } from "../actions";

export function NutDuyetBaiNop({ baiNopId }: { baiNopId: string }) {
  return (
    <NutDuyetTuChoi
      doiTuong="minh chứng"
      onDuyet={(nhanXet) => duyetBaiNop({ baiNopId, nhanXet })}
      onTuChoi={(nhanXet) => tuChoiBaiNop({ baiNopId, nhanXet })}
      thanhCongDuyet="Đã duyệt minh chứng."
      thanhCongTuChoi="Đã từ chối minh chứng."
    />
  );
}
