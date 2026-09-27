import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { DanhSachGiayTo } from "@/components/giay-to/danh-sach-giay-to";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function TrangNhanChiThi() {
  const u = await yeuCauVaiTro("ADMIN");
  return (
    <div>
      <TrangTieuDe tieuDe="Nhận chỉ thị của hiệu trưởng" moTa="Giấy tờ hiệu trưởng gửi có chọn admin. Chỉ đọc." />
      <DanhSachGiayTo userId={u.id} duongDan="/admin/chi-thi" />
    </div>
  );
}
