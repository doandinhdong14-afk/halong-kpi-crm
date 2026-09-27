import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function TrangQuyDinh() {
  await yeuCauVaiTro("HT");
  return <TrangTam tieuDe="Ban hành quy định" buoc={10} />;
}
