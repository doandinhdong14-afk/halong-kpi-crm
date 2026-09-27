// Xếp loại đăng ký (mục 9.2). Hàm thuần, dùng được cả ở client (xếp loại dự kiến).

export type Bac = { ten: string; diemToiThieu: number };

/** Bậc thấp nhất = bậc có điểm tối thiểu nhỏ nhất. */
export function bacThapNhat(bacs: Bac[]): string | null {
  if (!bacs.length) return null;
  return bacs.reduce((a, b) => (b.diemToiThieu < a.diemToiThieu ? b : a)).ten;
}

/** Bậc có điểm tối thiểu lớn nhất mà tongDiem ≥ điểm tối thiểu; không đủ bậc nào → bậc thấp nhất. */
export function tinhXepLoai(tongDiem: number, bacs: Bac[]): string | null {
  const dat = bacs.filter((b) => tongDiem >= b.diemToiThieu);
  if (!dat.length) return bacThapNhat(bacs);
  return dat.reduce((a, b) => (b.diemToiThieu > a.diemToiThieu ? b : a)).ten;
}
