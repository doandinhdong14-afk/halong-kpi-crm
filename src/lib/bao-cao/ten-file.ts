// Tên file báo cáo (mục 6.3, B15): BaoCao_<DonVi>_Ky<soKy>-<namHoc>_<YYYYMMDD>[_TamTinh].<duoi>
// Không dấu; đơn vị = tên bộ môn / khoa / "CacKhoaPhuTrach" (HP nhiều khoa) / "ToanTruong".

/** "Bộ môn Khoa học máy tính" → "BoMonKhoaHocMayTinh". */
export function khongDauLienNhau(ten: string): string {
  return ten
    .replace(/[đĐ]/g, (c) => (c === "đ" ? "d" : "D"))
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
}

export function tenFileBaoCao(p: {
  donVi: string;
  soKy: number;
  namHoc: string;
  /** "YYYY-MM-DD" (giờ VN). */
  ngay: string;
  tamTinh: boolean;
  duoi: "xlsx" | "pdf";
}): string {
  return `BaoCao_${khongDauLienNhau(p.donVi)}_Ky${p.soKy}-${p.namHoc}_${p.ngay.replace(/-/g, "")}${p.tamTinh ? "_TamTinh" : ""}.${p.duoi}`;
}
