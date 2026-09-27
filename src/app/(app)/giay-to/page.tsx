import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { DanhSachGiayTo } from "@/components/giay-to/danh-sach-giay-to";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function TrangNhanGiayTo() {
  const u = await yeuCauVaiTro("GV", "TBM", "TK", "HP");
  return (
    <div>
      <TrangTieuDe tieuDe="Nhận giấy tờ" moTa="Giấy tờ, quyết định hiệu trưởng gửi cho bạn." />
      <DanhSachGiayTo userId={u.id} duongDan="/giay-to" />
    </div>
  );
}
