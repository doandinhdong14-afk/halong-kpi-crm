import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function Page() {
  await yeuCauVaiTro("GV", "TBM", "TK", "HP");
  return <TrangTam tieuDe="Nhận giấy tờ" buoc={7} />;
}
