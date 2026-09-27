import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function TrangBaoCao() {
  await yeuCauVaiTro("TBM", "TK", "HP", "HT");
  return <TrangTam tieuDe="Xuất báo cáo" buoc={9} />;
}
