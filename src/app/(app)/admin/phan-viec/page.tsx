import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function TrangPhanViec() {
  await yeuCauVaiTro("ADMIN");
  return <TrangTam tieuDe="Phân việc đầu kỳ" buoc={4} />;
}
