import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function TrangCuoiKy() {
  await yeuCauVaiTro("GV", "TBM", "TK", "HP");
  return <TrangTam tieuDe="Cuối kỳ" buoc={6} />;
}
