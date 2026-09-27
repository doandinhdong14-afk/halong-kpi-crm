import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function TrangXemCauHinh() {
  await yeuCauVaiTro("ADMIN");
  return <TrangTam tieuDe="Xem cấu hình" buoc={11} />;
}
