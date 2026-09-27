import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function Page() {
  await yeuCauVaiTro("GV");
  return <TrangTam tieuDe="Cuối kỳ" buoc={5} />;
}
