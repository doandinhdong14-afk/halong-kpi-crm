import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function TrangDauKy() {
  await yeuCauVaiTro("GV", "TBM", "TK", "HP");
  return <TrangTam tieuDe="Đầu kỳ – Đăng ký nhiệm vụ" buoc={5} />;
}
